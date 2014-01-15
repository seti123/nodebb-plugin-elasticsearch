Trial to index nodebb posts, as far I see there is no hook to execute search and send back results to nodebb. How to do this?
```
TODO / open questions: 
1) How to hook into post changes?
2) Any plugin-api in node BB to perform search?
   should be in 2 stages, ES gives back postId's
   nodeBB checks permissions and displays result.
   E.g. fireSearchAction with callbackFunction that passes post ID's
   All TBD with nodeBB developers ...
4) Possibility to read ElasticSearch properties from config.json
   Es Host, Port, indexname, create automatic mapping.
   
What works:
- indexing new posts to local ES server (localhost:9200)
- automatic index creation "nodebb_posts"
- automatic setting of index mapping for autocompletion 
- on plugin activation in NodeBB admin GUI, ALL existing posts are indexed automatically
   TODO: store last index date, and index only new ... well but plugin 
   might be activated only once, and it might be an option to trigger the process
   again e.g after changing ES server ...
   
```

# Installation (on Debian)
## 1) ElasticSearch server

```
apt-get install openjdk-7-jre-headless -y
wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.6.deb
dpkg -i elasticsearch-0.90.6.deb
## install some useful plugins
/usr/share/elasticsearch/bin/plugin -install mobz/elasticsearch-head
/usr/share/elasticsearch/bin/plugin --install jettro/elasticsearch-gui 

open browser and go to http://localhost:9200/_plugin/head
```

## 2) NodeBB plugin 
```
   npm install seti123/nodebb-plugin-elasticsearch
```

## 3) restart nodeBB (./nodebb dev), activate plugin in admin and make some posts in nodeBB
```
# to see plugin loading and debug out put ...
./nodebb dev
```
## 5) Check autocomplete feature or search 

```
curl -X POST localhost:9200/nodebb_posts/_suggest -d '
{
  "nodebb_posts" : {
    "text" : "ElasticSearch",
    "completion" : {
      "field" : "content_suggest"
    }
  }
}'
```
Title suggested for autocomplete:
```
{"_shards":{"total":5,"successful":5,"failed":0},"nodebb_posts":[{"text":"ElasticSearch","offset":0,"length":13,"options":[{"text":"Another new blog","score":1.0}]}]}
```
Lets search
```
curl localhost:9200/nodebb_posts/_search?q=new
```

Result:

```
{

    "took": 3,
    "timed_out": false,
    "_shards": {
        "total": 5,
        "successful": 5,
        "failed": 0
    },
    "hits": {
        "total": 2,
        "max_score": 0.25,
        "hits": [
            {
                "_index": "nodebb_posts",
                "_type": "nodebb_posts",
                "_id": "26",
                "_score": 0.25,
                "_source": {
                    "pid": 26,
                    "uid": "1",
                    "tid": 23,
                    "content": "<p>this is the first blog entry with ElasticSearch support</p>\n",
                    "timestamp": 1389789466903,
                    "reputation": 0,
                    "editor": "",
                    "edited": 0,
                    "deleted": 0,
                    "title": "A new blog",
                    "content_suggest": [
                        "A new blog",
                        "<p>this is the first blog entry with ElasticSearch support</p>\n"
                    ]
                }
            },
            
            ....
```



