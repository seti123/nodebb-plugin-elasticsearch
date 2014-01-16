//elasticsearch-plugin.js
var topics =  require('../../src/topics');
// module.parent.require('./topics');
// module.parent.require('./topics')
var posts =  require('../../src/posts');
// odule.parent.require('./topics');
var esHost = "localhost:9200"
var postIndex = "nodebb_posts";
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: esHost,
  log: 'trace'
});
var extend = require('util')._extend;
var htmlToText = require('html-to-text');
var path = require('path'),
  nconf = require('nconf'),
  async = require('async')
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
                      
                      posts.forEach ( function (e, i) {   EsPlugin.indexPost (e) } );
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
        // test
        searchPostIds ('*Elastic*', 500, function (err, pids) {

        });
    } 
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
            var contentText = htmlToText.fromString (postData.content);
            postData.content_suggest = { input: [ htmlToText.fromString (postData.title), contentText.split(' ') ] , output: postData.title };
            client.index({
                  index: postIndex,
                  type: 'nodebb_posts',
                  id: postData.pid +'',
                  body: { tid: postData.tid, title: postData.title, pid: postData.pid, content: contentText, contentOriginal: postData.content, content_suggest: postData.content_suggest, timestamp: postData.timestamp }   
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

var searchPostIds = function (term, limit, callback)
{

    var allPid = [];

    // first we do a search, and specify a scroll timeout
    client.search({
      index: postIndex,
      type: postIndex,
      // Set to 30 seconds because we are calling right back
      scroll: '30s',
      fields: ['pid'],
      q: term
      ,size: limit
    }, function getMoreUntilDone(error, response) {
      // collect the title from each response
      if (error)
      {
            console.log(error);
            callback(error,null);
            return;
      }
      console.log(response);
      if (response.hits)
      {

      }
      for (var i=0;i<response.hits.hits.length; i++)
      {
        allPid.push(response.hits.hits[i].fields.pid);
      }
      callback(null,allPid)
      

      if (response.hits.total !== allPid.length) {
        // now we can call scroll over and over
        client.scroll({
          scrollId: response._scroll_id,
          scroll: '30s'
        }, getMoreUntilDone);
      } else {
        console.log('every "test" pid', allPid);
      }
    });

}

var searchTopicIds = function (term, limit, callback)
{

    var allPid = [];

    // first we do a search, and specify a scroll timeout
    client.search({
      index: postIndex,
      type: postIndex,
      // Set to 30 seconds because we are calling right back
      scroll: '30s',
      fields: ['tid'],
      q: term
      ,size: limit
    }, function getMoreUntilDone(error, response) {
      // collect the title from each response
      if (error)
      {
            console.log(error);
            callback(error,null);
            return;
      }
      console.log(response);
      if (response.hits)
      {

      }
      for (var i=0;i<response.hits.hits.length; i++)
      {
        allPid.push(response.hits.hits[i].fields.tid);
      }
      callback(null,allPid)
      

      if (response.hits.total !== allPid.length) {
        // now we can call scroll over and over
        client.scroll({
          scrollId: response._scroll_id,
          scroll: '30s'
        }, getMoreUntilDone);
      } else {
        console.log('every "test" pid', allPid);
      }
    });
}

function xinspect(o,i){
    if(typeof i=='undefined')i='';
    if(i.length>50)return '[MAX ITERATIONS]';
    var r=[];
    for(var p in o){
        var t=typeof o[p];
        r.push(i+'"'+p+'" ('+t+') => '+(t=='object' ? 'object:'+xinspect(o[p],i+'  ') : o[p]+''));
    }
    return r.join(i+'\n');
}

/***************************************************
* Experimental, try to replace /search/route
* might not work becaue in webserver.js to this route /api/ gets preficed
*/
var addRoute = function(custom_routes, callback) 
{

      custom_routes.routes.push({
              "route": '/search/:term',
              "method": "get",
              "options": function(req, res, callback) {
                      actualSearchToHookIn (req,res,callback);
              }
      });
      custom_routes.routes.push({
              "route": '/nodebb-plugins-elasticsearch/search/:term',
              "method": "get",
              "options": function(req, res, callback) {
                      actualSearchToHookIn (req,res,callback);
              }
      });

      callback(null, custom_routes);
};
                

var actualSearchToHookIn =  function (req, res, next) 
{
        var limit = 50;

        function searchPosts(callback) {
          //var esplugin = require ('nodebb-plugin-elasticsearch');
          if (true)
          {
            searchPostIds (req.params.term, 500, function(err, pids) {
            if (err) {
              return callback(err, null);
            }

            posts.getPostSummaryByPids(pids, false, function (err, posts) {
              if (err){
                return callback(err, null);
              }
              callback(null, posts);
            });


          });
          } else db.search('post', req.params.term, limit, function(err, pids) {
            if (err) {
              return callback(err, null);
            }

            posts.getPostSummaryByPids(pids, false, function (err, posts) {
              if (err){
                return callback(err, null);
              }
              callback(null, posts);
            });
          });
        }

        function searchTopics(callback) {
          //var esplugin = require ('nodebb-plugin-elasticsearch');
          if (true)
          {
              searchTopicIds (req.params.term, limit, function(err, tids) {
              if (err) {
                return callback(err, null);
              }

              topics.getTopicsByTids(tids, 0, function (topics) {
                callback(null, topics);
              }, 0);
            });

          } else db.search('topic', req.params.term, limit, function(err, tids) {
            if (err) {
              return callback(err, null);
            }

            topics.getTopicsByTids(tids, 0, function (topics) {
              callback(null, topics);
            }, 0);
          });
        }

        if ((req.user && req.user.uid) || meta.config.allowGuestSearching === '1') {
          async.parallel([searchPosts, searchTopics], function (err, results) {
            if (err) {
              return next(err);
            }

            return res.json({
              show_no_topics: results[1].length ? 'hide' : '',
              show_no_posts: results[0].length ? 'hide' : '',
              show_results: '',
              search_query: req.params.term,
              posts: results[0],
              topics: results[1],
              post_matches : results[0].length,
              topic_matches : results[1].length
            });
          });
        } else {
          res.send(403);
        }
};

module.exports.indexPost = EsPlugin.indexPost
module.exports.insertToEs = insertToEs
module.exports.pluginActivated = pluginActivated
module.exports.searchPostIds = searchPostIds;
module.exports.searchTopicIds = searchTopicIds;
module.exports.addRoute = addRoute;
module.exports.actualSearchToHookIn=actualSearchToHookIn;

