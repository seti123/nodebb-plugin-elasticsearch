//elasticsearch-plugin.js
var topics = require('../../src/topics');
var esHost = "localhost:9200"
var postIndex = "nodebb_posts";
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: esHost,
  log: 'trace'
});

var htmlToText = require('html-to-text');


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
            // Lets play around with autosuggestion
            // - if any word from post is typed, we want suggest post title
            // - if begin of Post tiel is typed as well ...
            postData.content_suggest = { input: [ htmlToText.fromString (postData.title), htmlToText.fromString (postData.content).split(' ') ] , output: postData.title };
            client.index({
                  index: postIndex,
                  type: 'nodebb_posts',
                  id: postData.pid,
                  body: postData  
              }, 
              function (error, response) {
                        if (error) 
                            console.log (error);
                        else
                            console.log (response);
                        // to avoid side effects n modified postData object
                        // we remove added properties. 
                        delete postData.content_suggest;
                        delete postData.title
              });
            
        }
module.exports.indexPost = EsPlugin.indexPost
module.exports.insertToEs = insertToEs
