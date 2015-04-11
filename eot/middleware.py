from django.shortcuts import redirect


class MobileSSOMiddleware(object):
    def process_request(self, request):
        mobile_redirect = request.GET.get('mobile')
        if mobile_redirect:
            print 'mobile_url put', mobile_redirect
            request.session['mobile'] = mobile_redirect
            return redirect('/accounts/login/facebook/?next=/')

        if request.path == '/' or request.path == '/accounts/profile/':
            mobile_url = request.session.get('mobile')
            print 'mobile_url read', mobile_url
            if mobile_url:
                del request.session['mobile']
                return redirect(mobile_url)