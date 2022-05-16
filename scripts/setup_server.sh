#!/bin/sh

sudo su
cd /usr/local/bin
mkdir ffmpeg
cd ffmpeg
wget https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz
tar -xvf ffmpeg-git-amd64-static.tar.xz
ln -s /usr/local/bin/ffmpeg/ffmpeg /usr/bin/ffmpeg
# node
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs
sudo yum install gcc-c++ make -y
# yarn and extra npm global packages
npm install yarn -g
npm i -g @nestjs/cli
npm install -g typescript