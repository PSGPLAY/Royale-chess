from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0001_initial')]

    operations = [
        migrations.AlterField(
            model_name='playerprofile', name='rating_elo',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='playerprofile', name='normal_rating',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='playerprofile', name='royale_rating',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
