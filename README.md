### 1. setup main crontab under root user;
```
sudo crontab -e
*/5 * * cd /home/rockhawk/Code/mixin/hawkassist; sudo -u rockhawk node index.js >> index.log & 
```

### 2. replace sudo -u _username_ by your own name, and the _pathname_;

### 3. then it will run index.js every 5 minutes;

### 4. put the decrypto key in conf/xxx.key file, add line to ~/.bashrc
```
export CONFIG_ENCRYPTION_KEY=$(cat xxxx/conf/xxx.key)
```
`source ~/.bashrc`
