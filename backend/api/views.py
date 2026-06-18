# backend/api/views.py

import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import EmailMultiAlternatives
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from .models import Profile
from .serializers import (
    RegisterSerializer, 
    VerifyOTPSerializer, 
    ProfileSerializer, 
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PostSerializer, CommentSerializer
)
from .models import Follow # Add this import
from rest_framework import viewsets, serializers # <-- 1. ADD 'serializers' TO YOUR IMPORTS
from .models import Post, Comment
from .serializers import PostSerializer
from rest_framework.decorators import action # Add this import
from rest_framework import parsers
from .serializers import FollowerUserSerializer # Add this import

from django.db.models import Q # Add this import
from .models import ChatMessage # Add this import
from .serializers import ChatMessageSerializer # Add this import
from .serializers import RecruiterPostSerializer


from .models import Skill # Add this import
from .serializers import SkillSerializer # Add this import
from rest_framework import generics # Add this import

class RegisterView(APIView):
    """Handles initial user registration and sends a styled HTML OTP email."""
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            first_name=serializer.validated_data['first_name'],
            last_name=serializer.validated_data['last_name'],
            is_active=False
        )

        otp = random.randint(100000, 999999)
        otp_expiry = timezone.now() + timedelta(minutes=5)
        Profile.objects.create(user=user, otp=str(otp), otp_expiry=otp_expiry)

        # Render and send the HTML email
        html_content = render_to_string('email/otp_email.html', {'otp': otp})
        text_content = strip_tags(html_content)
        email = EmailMultiAlternatives(
            'Your OTP for TPMS Registration',
            text_content,
            'noreply@tpms.com',
            [user.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        return Response({'message': 'User registered. Please check your email for OTP.'}, status=status.HTTP_201_CREATED)



class VerifyOTPView(APIView):
    """Handles OTP verification, activates the user, and provides a temporary token."""
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            profile = Profile.objects.get(user__email=email)
            user = profile.user

            if profile.otp != otp or timezone.now() > profile.otp_expiry:
                return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

            user.is_active = True
            user.save()
            profile.otp = None
            profile.otp_expiry = None
            profile.save()

            # --- THIS IS THE FIX ---
            # Create and return the token for the next step.
            token, _ = Token.objects.get_or_create(user=user)

            return Response({
                'message': 'OTP verified successfully. Please complete your profile.',
                'token': token.key
            }, status=status.HTTP_200_OK)

        except Profile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

class LoginView(APIView):
    """Handles user login and returns an authentication token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if not user.check_password(password):
            return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return Response({'error': 'Your account is inactive. Please verify your OTP.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    """Handles user logout by deleting the authentication token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class CompleteProfileView(APIView):
    """Handles submission of additional user details and returns the complete user profile."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            user_serializer = UserProfileSerializer(request.user)
            return Response(user_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# backend/api/views.py

class ProfileView(APIView):
    """Retrieves and updates the profile of the currently authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        # Pass the request to our upgraded serializer
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PasswordResetRequestView(APIView):
    """Handles the request for a password reset OTP by sending a styled HTML email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email_addr = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email_addr)
            profile = user.profile
            
            otp = random.randint(100000, 999999)
            otp_expiry = timezone.now() + timedelta(minutes=5)
            
            profile.otp = str(otp)
            profile.otp_expiry = otp_expiry
            profile.save()
            
            html_content = render_to_string('email/otp_email.html', {'otp': otp})
            text_content = strip_tags(html_content)
            email = EmailMultiAlternatives(
                'Your Password Reset OTP',
                text_content,
                'noreply@tpms.com',
                [user.email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
        except User.DoesNotExist:
            pass
        
        return Response({'message': 'If an account with this email exists, an OTP has been sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    """Handles the confirmation of a password reset with an OTP."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        password = serializer.validated_data['password']
        
        try:
            profile = Profile.objects.get(user__email=email)
            user = profile.user
            
            if profile.otp != otp or timezone.now() > profile.otp_expiry:
                return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(password)
            user.save()
            
            profile.otp = None
            profile.otp_expiry = None
            profile.save()
            
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        

        
class DeleteUserView(APIView):
    """
    View to handle user account deletion.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        try:
            # The user's Profile and Token will be deleted automatically
            # because of the on_delete=models.CASCADE setting.
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': 'Failed to delete account.'}, status=status.HTTP_400_BAD_REQUEST)
        

# backend/api/views.py

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Only allow recruiters to post
      
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        if user in post.likes.all():
            post.likes.remove(user)
        else:
            post.likes.add(user)
        return Response(self.get_serializer(post).data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def interest(self, request, pk=None):
        post = self.get_object()
        user = request.user

        if not hasattr(user, 'profile') or user.profile.role != 'job_seeker':
            return Response({'error': 'Only job seekers can show interest.'}, status=status.HTTP_403_FORBIDDEN)

        if user in post.interested_users.all():
            post.interested_users.remove(user)
        else:
            post.interested_users.add(user)

        return Response(self.get_serializer(post).data, status=status.HTTP_200_OK)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        post = Post.objects.get(pk=self.kwargs['post_pk'])
        serializer.save(author=self.request.user, post=post)

    def get_queryset(self):
        return self.queryset.filter(post_id=self.kwargs['post_pk'])
    

class ProfileDetailView(APIView):
    """
    View to retrieve a specific user's profile by their username.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username, format=None):
        try:
            user = User.objects.get(username=username)
            # Pass the request context to the serializer
            serializer = UserProfileSerializer(user, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        


class FollowToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id, format=None):
        try:
            user_to_follow = User.objects.get(pk=user_id)
            if user_to_follow == request.user:
                return Response({'error': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
            Follow.objects.get_or_create(follower=request.user, following=user_to_follow)
            return Response({'status': 'followed'}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id, format=None):
        try:
            user_to_unfollow = User.objects.get(pk=user_id)
            follow_instance = Follow.objects.filter(follower=request.user, following=user_to_unfollow)
            if follow_instance.exists():
                follow_instance.delete()
            return Response({'status': 'unfollowed'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

class FollowView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    # 2. Add these parsers to handle different request types
    parser_classes = [parsers.JSONParser, parsers.FormParser, parsers.MultiPartParser]

    def post(self, request, user_id, format=None):
        try:
            user_to_follow = User.objects.get(pk=user_id)
            if user_to_follow == request.user:
                return Response({'error': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
            
            Follow.objects.get_or_create(follower=request.user, following=user_to_follow)
            return Response({'status': 'followed'}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id, format=None):
        try:
            user_to_unfollow = User.objects.get(pk=user_id)
            follow_instance = Follow.objects.filter(follower=request.user, following=user_to_unfollow)
            if follow_instance.exists():
                follow_instance.delete()
            return Response({'status': 'unfollowed'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
class FollowStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id, format=None):
        try:
            user = User.objects.get(pk=user_id)
            followers_count = Follow.objects.filter(following=user).count()
            following_count = Follow.objects.filter(follower=user).count()
            is_followed_by_user = Follow.objects.filter(follower=request.user, following=user).exists()

            return Response({
                'followers_count': followers_count,
                'following_count': following_count,
                'is_followed_by_user': is_followed_by_user
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        

class FollowListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id, list_type, format=None):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if list_type == 'followers':
            # Get all Follow instances where the target_user is being followed
            user_ids = Follow.objects.filter(following=target_user).values_list('follower_id', flat=True)
        elif list_type == 'following':
            # Get all Follow instances where the target_user is the follower
            user_ids = Follow.objects.filter(follower=target_user).values_list('following_id', flat=True)
        else:
            return Response({'error': 'Invalid list type.'}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(id__in=user_ids)
        serializer = FollowerUserSerializer(users, many=True)
        return Response(serializer.data)
    

class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        users = User.objects.exclude(pk=request.user.pk)
        serializer = UserProfileSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

class MessageHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, user_id):
        # Find messages between the current user and the other user
        messages = ChatMessage.objects.filter(
            (Q(sender=request.user) & Q(receiver_id=user_id)) |
            (Q(sender_id=user_id) & Q(receiver=request.user))
        ).order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
# backend/api/views.py
# backend/api/views.py

class InterestedPostsView(APIView):
    """
    For Job Seekers: Returns a list of posts the current user is interested in.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Find all posts where the current user is in the 'interested_users' list
        interested_posts = Post.objects.filter(interested_users=user)
        serializer = PostSerializer(interested_posts, many=True, context={'request': request})
        return Response(serializer.data)

class RecruiterPostsView(APIView):
    """
    For Recruiters: Returns a list of posts authored by the current user.
    The serializer will automatically include the list of interested users for each post.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'profile') or user.profile.role != 'recruiter':
            return Response({'error': 'Only recruiters can access this view.'}, status=status.HTTP_403_FORBIDDEN)

        recruiter_posts = Post.objects.filter(author=user)
        serializer = PostSerializer(recruiter_posts, many=True, context={'request': request})
        return Response(serializer.data)
    


class RecruiterPostsView(APIView):
    """
    For Recruiters: Returns a list of posts authored by the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'profile') or user.profile.role != 'recruiter':
            return Response({'error': 'Only recruiters can access this view.'}, status=status.HTTP_403_FORBIDDEN)

        recruiter_posts = Post.objects.filter(author=user)

        # --- THIS IS THE FIX ---
        # Use the new, more detailed serializer for this specific view
        serializer = RecruiterPostSerializer(recruiter_posts, many=True)
        return Response(serializer.data)
    

class UserSearchView(APIView):
    """
    View to search for users by username, first_name, last_name, AND skills.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get the search query and skills from the URL parameters
        query = request.query_params.get('q', None)
        skill_ids_str = request.query_params.get('skills', None)

        # Start with all users except the person searching
        users = User.objects.all().exclude(pk=request.user.pk)

        # Filter by text query if it exists
        if query:
            users = users.filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )

        # --- THIS IS THE NEW LOGIC ---
        # Filter by skills if they are provided
        if skill_ids_str:
            # Split the comma-separated string of IDs into a list
            skills_list = skill_ids_str.split(',')
            # Filter users whose profile (profile__) has skills (skills__) 
            # whose ID is in our list (id__in)
            users = users.filter(profile__skills__id__in=skills_list).distinct()

        serializer = FollowerUserSerializer(users, many=True)
        return Response(serializer.data)
    

class SkillListView(generics.ListAPIView):
    """
    View to list all skills. Supports searching.
    Example: /api/skills/?search=java
    """
    queryset = Skill.objects.all().order_by('name')
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)
        return queryset

class UserSkillView(APIView):
    """
    View to add or remove a skill from the logged-in user's profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, skill_id, format=None):
        try:
            skill = Skill.objects.get(pk=skill_id)
            request.user.profile.skills.add(skill)
            serializer = UserProfileSerializer(request.user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Skill.DoesNotExist:
            return Response({'error': 'Skill not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, skill_id, format=None):
        try:
            skill = Skill.objects.get(pk=skill_id)
            request.user.profile.skills.remove(skill)
            serializer = UserProfileSerializer(request.user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Skill.DoesNotExist:
            return Response({'error': 'Skill not found.'}, status=status.HTTP_404_NOT_FOUND)
        
class FollowingListView(APIView):
    """
    View to list all users that the current user is following.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        current_user = request.user
        # Get the IDs of all users the current user is following
        following_ids = Follow.objects.filter(follower=current_user).values_list('following_id', flat=True)
        # Get the User objects for those IDs
        following_users = User.objects.filter(id__in=following_ids)

        serializer = UserProfileSerializer(following_users, many=True, context={'request': request})
        return Response(serializer.data)