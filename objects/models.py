from django.db import models
import facebook


class Event(models.Model):
    user = models.ForeignKey('users.User')
    description = models.CharField(max_length=140)
    lat = models.DecimalField(max_digits=20, decimal_places=16)
    lon = models.DecimalField(max_digits=20, decimal_places=16)

    # Ratings
    likes = models.PositiveIntegerField(default=0, editable=0)

    added = models.DateTimeField(auto_now_add=True)


class Like(models.Model):
    user = models.ForeignKey('users.User')
    event = models.ForeignKey(Event)
    added = models.DateTimeField(auto_now_add=True)


def recount_findings(instance, created, *args, **kwargs):
    if not created:
        return

    instance.user.findings_count = Event.objects.filter(user=instance.user).count()
    instance.user.rating = Event.objects.filter(user=instance.user).count()  # TODO: better calc
    instance.user.save()

    # TODO: Adds a FB post when fb approves app perms
    # auth = instance.user.social_auth.first()
    # graph = facebook.GraphAPI(auth.extra_data['access_token'])
    # graph.put_object('me', 'feed', message=instance.description)

models.signals.post_save.connect(recount_findings, sender=Event)
