### 1. setup main crontab under root user;
```
sudo crontab -e
*/5 * * cd _/home/rockhawk/Code/mixin/hawkassist_; sudo -u _rockhawk_ node index.js > index.log & 
```

### 2. then it will run index.js every 5 minutes;

### 3. replace sudo -u username by your own name, and the pathname;
