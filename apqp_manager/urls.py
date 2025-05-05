from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication URLs
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/login/'), name='logout'),
    
    # API URLs
    path('api/', include('core.urls')),
    path('api-auth/', include('rest_framework.urls')),
    
    # Template URLs
    path('api-testing/', TemplateView.as_view(template_name='api_testing.html'), name='api_testing'),
    path('', TemplateView.as_view(template_name='api_testing.html'), name='home'),
    path('analyse/', TemplateView.as_view(template_name='analyse_dashboard.html'), name='analyse_dashboard'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)