//elasticsearch-plugin.js
var topics = require('../../src/topics');
var posts = require('../../src/posts');
var esHost = "localhost:9200"
var postIndex = "nodebb_posts";
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: esHost,
  log: 'trace'
});
var extend = require('util')._extend;
var htmlToText = require('html-to-text');

function createIndex (cb)
{
  client.indices.create ({
        index : postIndex,
        body: { mappings:
                {
                  nodebb_posts: {
                    properties : {
                     content : { type : "string" },
                     title : { type : "string" },
                     content_suggest : {
                        type :     "completion"
                      }
                  }
                 }
              }
          }
    }, 
    function (e, d) {    
        if (! e) 
            cb();
        else
          if (! /IndexAlreadyExistsException/im.test(e) ) // we can ignore if index is already there
             console.log ("Error creating mapping " + e);
          else
              cb();
    });
  
  
}

function indexAll ()
{
  console.log ('plugin activated, start indexing all posts ...')
  topics.getAllTopics (-1, null, function (error, topics) 
  {
           //var bulkInstructions = [];
           //var tpl  = { index:  { _index: postIndex, _type: postIndex, _id: 0 } };
           for (var i=0; i<topics.length; i++)
           {
                //console.log (JSON.stringify (topics[i]));
                console.log (topics[i].tid);
                posts.getPostsByTid (topics[i].tid, new Date(0).getTime(), new Date().getTime(), function (err, posts) {
                  console.log (JSON.stringify(posts));
                  if (!err) 
                  {
                      
                      posts.forEach ( function (i, e) {   insertToEs (i) } );
                  } else console.log (err);

                });
           //     var cmd = extend ({}, tpl);
                //console.log (JSON.stringyfy(tpoics));
            //    cmd._id = topics.pid;
            //    bulkInstructions.push (cmd);

           }
           //client.bulk ({
           //   body: bulkInstructions
           //}, function (e,d) {
           //   console.log (e || d);
           //
           //});
       });
}

var pluginActivated = function (pluginId) {
    console.log ("ES activated" + pluginId);
    if (pluginId == 'nodebb-plugin-elasticsearch') {
        // we got something to do, its our plugin ...
        // lets index all  topics just to be sure nobody is disappointed on search ...
        createIndex ( indexAll );
    } 
}

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
            if (! postData )
              return;
            // Lets play around with autosuggestion
            // - if any word from post is typed, we want suggest post title
            // - if begin of Post tiel is typed as well ...
            postData.content_suggest = { input: [ htmlToText.fromString (postData.title), htmlToText.fromString (postData.content).split(' ') ] , output: postData.title };
            client.index({
                  index: postIndex,
                  type: 'nodebb_posts',
                  id: postData.pid +'',
                  body: { tid: postData.tid, title: postData.title, pid: postData.pid, content: postData.content, content_suggest: postData.content_suggest, timestamp: postData.timestamp }   
                  //upsert: postDat
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
module.exports.pluginActivated = pluginActivated
