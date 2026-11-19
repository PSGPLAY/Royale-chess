from django.db import migrations, models
from gameplay.models import create_match_access_token


class Migration(migrations.Migration):
    dependencies = [('gameplay', '0004_alter_match_mode')]

    operations = [
        migrations.AddField(
            model_name='match',
            name='white_access_token',
            field=models.CharField(default=create_match_access_token, editable=False, max_length=64),
        ),
        migrations.AddField(
            model_name='match',
            name='black_access_token',
            field=models.CharField(default=create_match_access_token, editable=False, max_length=64),
        ),
    ]
