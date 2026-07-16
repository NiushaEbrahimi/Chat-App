# apps/chat/pagination.py
from rest_framework.pagination import CursorPagination

class MessageCursorPagination(CursorPagination):
    page_size = 100
    ordering = '-created_at'