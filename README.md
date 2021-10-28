## Save decrypto key into environment:

```
vi /etc/environment
CONFIG_ENCRYPTION_KEY="xxxxx"
```

## Start app on boot:

`sudo crontab -e`

```
@reboot cd /home/rock/code/mixinbot_hawkassist/; node appHawkAssist.js > log/app.log

*/13 * * * * cd /home/rock/code/mixinbot_hawkassist/; node src/schedule.js > log/schedule.log
```


