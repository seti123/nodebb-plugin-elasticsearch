Trial to index nodebb posts, as far I see there is no hook to execute search and send back results to nodebb. How to do this?

Installation (on Debian)
1) ElasticSearch server

apt-get install openjdk-7-jre-headless -y
wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.6.deb
dpkg -i elasticsearch-0.90.6.deb
/usr/share/elasticsearch/bin/plugin -install mobz/elasticsearch-head
/usr/share/elasticsearch/bin/plugin --install jettro/elasticsearch-gui 


2) NodeBB plugin 
   npm install seti123/nodebb-plugin-elasticsearch
   


