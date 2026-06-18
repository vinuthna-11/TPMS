from django.contrib import admin
from .models import Profile, Post, Follow, Comment

admin.site.register(Profile)
admin.site.register(Post)
admin.site.register(Follow)
admin.site.register(Comment)
