# Getting started with Backend

## Steps to setup backend server locally

Prerequisite:

Check if NodeJS is installed on your system - `node --verison`.
Ensure the version is v18 or above.
If you see `command not found` error, then install NodeJS from <https://nodejs.org/en>

1. Clone the repository
1. Run the command `cd locally-around-ai-be` to change directory.
1. Run command `npm install`
1. Create a `.env` file and add the Environment variables.
1. Run the command `npm run start:dev` to run the server.

Server will be running on port 3000. URL is <http://localhost:3000/>

## Initial Deployment

1. SSH to AWS EC2 Server

`ssh -i <pem_file> <ec2_ssh_key>`

1. Enter as super user

`sudo su`

1. Update your system

`apt update && apt upgrade`

1. Install Nginx, Certbot and Python3-Certbot-Nginx

`sudo apt install nginx certbot python3-certbot-nginx`

1. UFW Firewall Configuration

`sudo ufw allow 'Nginx Full'`

1. Allow OpenSSH

`ufw allow OpenSSH`

1. Enable Firewall

`ufw enable`

1. Install NVM and Node.js

`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash`

1. Reload your shell.

`exec $SHELL`

1. Install nvm.

`nvm install --lts`

1. Check Node and NPM version

`npm --v && node -v`

1. (Optional) If NPM is not installed

`apt install npm`

1. Install PM2

`npm i -g pm2`

1. Change directory to www folder

`cd /var/www`

1. Clone both frontend and backend project in this folder using git

1. Change directory to cloned folder and create a .env file with the following variable

For backend.

```bash
DB_HOST=<mongo_db_url>

MAPS_API_KEY=<google_maps_api_key>

ACCESS_TOKEN_SECRET=<secret_key>

REFRESH_TOKEN_SECRET=<secret_key>

CHAT_GPT_ORG_ID=<chat_gpt_org_id>

OPENAI_API_KEY=<chat_gpt_api_key>

MSG91_TEMPLATED_ID=<msg_91_template_id>

MSG91_AUTH_KEY=<msg_91_auth_key>

WHATSAPP_PHONE_NUMBER_ID=<whatsapp_phone_number>

WHATSAPP_API_VERSION=<version>

WHATSAPP_ACCESS_TOKEN=<whatsapp_access_token>
```

For frontend

```bash
NEXT_PUBLIC_API_URL=https://myaroundly.com/api/
NEXT_PUBLIC_GOOGLE_ID=G-TV8HLDB7FJ

```

1. Build the project

`npm run build`

1. Configure Nginx

`cd /etc/nginx/sites-available`

1. Create a new file and name it to your domain name. Then, open it with nano.

```bash
touch myaroundly
nano myaroundly
```

1. Copy and paste the following code in this file

```bash
server {
        listen 80;
        server_name myaroundly.com; # !!! - change to your domain name
      gzip on;
        gzip_proxied any;
        gzip_types application/javascript application/x-javascript text/css text/javascript;
        gzip_comp_level 5;
        gzip_buffers 16 8k;
        gzip_min_length 256;

    location /api/ {
                proxy_pass http://127.0.0.1:3000/api/; # !!! - change to your app port
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }

    location /_next/static/ {
                alias /var/www/myaroundly/.next/static/; # !!! - change to your app name
                expires 365d;
                access_log off;
        }

    location / {
                proxy_pass http://127.0.0.1:3001; # !!! - change to your app port
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }
}
```

1. Now, save (ctrl+o) and exit (ctrl+x).

1. Go back to /etc/nginx/ and list the files.

```bash
cd /etc/nginx/ or cd ..
ls
```

1. update the nginx.conf file. Open it with nano.

`nano nginx.conf`

```bash
##
        # Virtual Host Configs
        ##
        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*; # !!! - find this line
```

```bash
##
        # Virtual Host Configs
        ##
        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-available/*; # !!! - change to this line
```

1. Now, save (ctrl+o) and exit (ctrl+x).

1. Restart Nginx and check the syntax.

```bash
systemctl restart nginx
nginx -t
```

1. Clearing sites-enabled and sites-available directories.

```bash
cd sites-available
rm default
cd ..
cd sites-enabled
rm default
```

1. Restart Nginx again.

`systemctl restart nginx`

1. Configure PM2

```bash
cd /var/www/be

pm2 start index.js --name "be"

cd /var/www/fe

pm2 start npm --name "fe" -- start
```

1. SSL Certificate

> Make sure things are properly configured in Route53 on AWS

`sudo certbot --nginx -d myaroundly.com`

1. Restart Nginx.

`systemctl restart nginx`

1. Check the domain. Done!!!!

## Regular deployment

> SSH to AWS EC2 Server

1. Enter as superuser run command

   ```bash
   sudo su
   cd /var/www
   cd be
   ```

2. Pull the latest code from gitlab then install packages

   ```bash
   git merge
   npm i
   ```

3. create a .env file with the following variable.

   ```bash
   DB_HOST=<mongo_db_url>

   MAPS_API_KEY=<google_maps_api_key>

   ACCESS_TOKEN_SECRET=<secret_key>

   REFRESH_TOKEN_SECRET=<secret_key>

   CHAT_GPT_ORG_ID=<chat_gpt_org_id>

   CHAT_GPT_API_KEY=<chat_gpt_api_key>

   MSG91_TEMPLATED_ID=<msg_91_template_id>

   MSG91_AUTH_KEY=<msg_91_auth_key>
   ```

4. (Optional) Creating a seed data for testing

   ```bash
   node  seeder.js
   ```

5. Start the pm2 server using

   ```bash
   pm2 restart be
   ```

## Nginx.conf file for running locally

```bash
events {
    worker_connections  4096;  ## Default: 1024
}
http {
    server {
        listen 8080;

        server_name localhost;

        location /api/ {
            proxy_pass http://127.0.0.1:3000/api/;
            proxy_set_header Host $host;
        }

        location / {
            proxy_pass http://127.0.0.1:3001/;
            proxy_set_header Host $host;
        }
    }
}
```
#   l e b  
 