### 1. setup main crontab under root user;
```
sudo crontab -e
*/5 * * cd /home/rockhawk/Code/mixin/hawkassist; sudo -u rockhawk node index.js >> index.log & 
```

### 2. replace sudo -u _username_ by your own name, and the _pathname_;

### 3. then it will run index.js every 5 minutes;
