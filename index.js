//elasticsearch-plugin.js
var topics = require('../../src/topics');
var esHost = "localhost:9200"
var postIndex = "nodebb_posts";
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: esHost,
  log: 'trace'
});

var EsPlugin = {
        indexPost: function(postData) {
            // do something with postData here
            // so what do we get here ?
            console.log (JSON.stringify(postData));
            topics.getTopicField(postData.tid, 'title', function(err, title) {
    				// use title
    				postData.title = title;
    				insertToEs (postData);
			});
        },
        
        
        
    };


var insertToEs = function (postData) {
            // collect complete post title, text
            // Upsert is used to either insert or update the document
            console.log ("insertToEs: " + JSON.stringify (postData));
            client.index({
                  index: postIndex,
                  type: 'nodebb_post',
                  id: postData.pid,
                  body: postData  
                  //upsert: postDat
              }, 
              function (error, response) {
                        if (error) 
                            console.log (error);
                        else
                            console.log (response);
              });
            
        }
module.exports.indexPost = EsPlugin.indexPost
module.exports.insertToEs = insertToEs
