# backend/api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
from .models import Post, Comment
from .models import ChatMessage
from .models import Skill # Add Skill to your imports


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for the initial user registration."""
    # We now declare first_name and last_name explicitly
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)

    class Meta:
        model = User
        # Add 'first_name' and 'last_name' to the fields list
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying the OTP."""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)





class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for completing the user profile."""
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        # 'full_name' has been REMOVED from this list
        fields = ['role', 'dob', 'address', 'phone_number', 'gender','skills', 'profile_picture', 'bio']


# backend/api/serializers.py

class UserProfileSerializer(serializers.ModelSerializer):
    """A serializer to display AND update a user's full profile."""
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['username', 'email'] # Username and email cannot be changed here

    def update(self, instance, validated_data):
        # This custom update method handles saving data to both User and Profile models
        profile_data = validated_data.pop('profile', {})
        profile = instance.profile

        # Update User fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        # Update nested Profile fields
        # This will handle the profile picture and other details
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance
# backend/api/serializers.py


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset OTP."""
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming the password reset."""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(write_only=True)


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_username', 'author_profile_picture', 'content', 'created_at']
        read_only_fields = ['author', 'post']

    def get_author_profile_picture(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.profile_picture:
            return obj.author.profile.profile_picture.url
        return None

class InterestedUserSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture_url']
    def get_profile_picture_url(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_picture:
            return obj.profile.profile_picture.url
        return None


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_profile_picture = serializers.SerializerMethodField()
    author_role = serializers.CharField(source='author.profile.role', read_only=True)

    # Add fields for likes and comments
    likes_count = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    interested_users_count = serializers.SerializerMethodField()
    is_interested_by_user = serializers.SerializerMethodField()


    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_username', 'author_profile_picture', 'author_role', 
            'content', 'attachment', 'created_at', 'likes_count', 'is_liked_by_user', 'interested_users_count', 'is_interested_by_user','comments'
        ]
        read_only_fields = ['author']

    def get_author_profile_picture(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.profile_picture:
            return obj.author.profile.profile_picture.url
        return None

    # Add these functions to calculate the like data
    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked_by_user(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and obj.likes.filter(id=user.id).exists()
    
    def get_interested_users_count(self, obj):
        return obj.interested_users.count()

    def get_is_interested_by_user(self, obj):
        user = self.context['request'].user
        if user.is_authenticated and hasattr(user, 'profile'):
            return obj.interested_users.filter(id=user.id).exists()
        return False

# backend/api/serializers.py
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['sender', 'receiver', 'message', 'timestamp']
# ... (Your other serializers like ProfileSerializer, PostSerializer, etc. are here) ...

class FollowerUserSerializer(serializers.ModelSerializer):
    """A lightweight serializer for displaying users in follower/following lists."""
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture_url']

    def get_profile_picture_url(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_picture:
            return obj.profile.profile_picture.url
        return None
    

class RecruiterPostSerializer(serializers.ModelSerializer):
    interested_users_count = serializers.SerializerMethodField()
    # This line will nest the full list of interested user objects
    interested_users = InterestedUserSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        # Define the fields this serializer will show
        fields = ['id', 'content', 'created_at', 'interested_users_count', 'interested_users']

    def get_interested_users_count(self, obj):
        return obj.interested_users.count()
    
