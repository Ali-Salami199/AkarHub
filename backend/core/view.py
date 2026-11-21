from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


def _get_profile_image_url(request, user):
    img = getattr(user, 'profile_image', None)
    if img and getattr(img, 'url', None):
        return request.build_absolute_uri(img.url)
    return None


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_profile_view(request):
    user = request.user

    if request.method == 'GET':
        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone_number": user.phone_number,
            "profile_image": _get_profile_image_url(request, user),
        })

    # PUT أو PATCH
    if 'first_name' in request.data:
        user.first_name = request.data.get('first_name', user.first_name)
    if 'last_name' in request.data:
        user.last_name = request.data.get('last_name', user.last_name)
    if 'email' in request.data:
        user.email = request.data.get('email', user.email)
    if 'phone_number' in request.data:
        user.phone_number = request.data.get('phone_number', user.phone_number)

    # حفظ الصورة الجديدة إذا تم إرسالها ضمن request.FILES
    if 'profile_image' in request.FILES:
        user.profile_image = request.FILES['profile_image']

    user.save()

    return Response({
        "message": "Updated successfully",
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "profile_image": _get_profile_image_url(request, user),
    }, status=status.HTTP_200_OK)