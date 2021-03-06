/**
 * angular-websql
 * Helps you generate and run websql queries with angular services.
 * © MIT License
 */
"use strict";
angular.module("angular-websql", []).factory("$webSql", [
    function() {
      return {
        openDatabase: function(dbName, version, desc, size) {
          try {
            var db = openDatabase(dbName, version, desc, size);
            if (typeof(openDatabase) == "undefined")
              throw "Browser does not support web sql";
            return {
              executeQuery: function(query, values) {
                  var deferred = Q.defer();
                db.transaction(function(tx) {
                    try{
                    tx.executeSql(query, values, function(tx, results) {
                        deferred.resolve(results);
                    },function(tx,results){
                        console.error(query);
                        console.error(values);
                        console.error(results);
                        deferred.reject(results);
                    }
                    );
                    }catch(e){
                        console.log(e);
                    }
                },function(e){
                    console.log('transaction error');
                    deferred.reject(e);
                });
                return deferred.promise;
              },
              insert: function(c, e) {
                var f = "INSERT INTO `{tableName}` ({fields}) VALUES({values});";
                var a = "",
                b = "",
                v = [];
                for (var d in e) {
                  a += (Object.keys(e)[Object.keys(e).length - 1] == d) ? "`" + d + "`" : "`" + d + "`, ";
                  b += (Object.keys(e)[Object.keys(e).length - 1] == d) ? "?" : "?, ";
                  v.push(e[d]);
                }
                return this.executeQuery(this.replace(f, {
                  "{tableName}": c,
                  "{fields}": a,
                  "{values}": b
                }), v);
              },
              update: function(b, g, c) {
                var f = "UPDATE `{tableName}` SET {update} WHERE {where}; ";
                var e = "";
                var v = [];
                var first=true;
                for (var d in g) {
                    if(first){
                        first = false;
                    }
                    else{
                        e += ",";
                    }
                  e += "`" + d + "`= ?";
                  v.push(g[d]);
                }
                var a = this.whereClause(c);
                return this.executeQuery(this.replace(f, {
                  "{tableName}": b,
                  "{update}": e,
                  "{where}": a.w
                }), v.concat(a.p) );
              },
              del: function(b, c) {
                var d = "DELETE FROM `{tableName}` WHERE {where}; ";
                var a = this.whereClause(c);
                return this.executeQuery(this.replace(d, {
                  "{tableName}": b,
                  "{where}": a.w
                }), a.p);
              },
              select: function(b, c) {
                var d = "SELECT * FROM `{tableName}` WHERE {where}; ";
                var a = this.whereClause(c);
                return this.executeQuery(this.replace(d, {
                  "{tableName}": b,
                  "{where}": a.w
                }), a.p);
              },
              selectAll: function(a) {
                return this.executeQuery("SELECT * FROM `" + a + "`; ", []);
              },
              whereClause: function(b) {
                var a = "",
                v = [];
                if(angular.isArray(b)){
                    for(var i=0;i!=b.length;i++){
                        var condition = b[i];
                        if(condition.union){
                            a+=condition.union;
                        }
                        else if(i!==0){
                            a+=" AND ";
                        }
                        a+="`" + condition.column + "` ";
                        if(condition.operator){
                            a+=condition.operator;
                        }
                        else{
                            a+="=";
                        }
                        if(angular.isArray(condition.value)){
                            a+="(";
                            for(var j=0;j!=condition.value.length;j++){
                                if(j!==0){
                                    a+=',?';
                                }
                                else{
                                    a+='?';
                                }
                                v.push(condition.value[j]);
                            }
                            a+=")";

                        }
                        else{
                            var value = String(condition.value);
                            if(value.match(/NULL/ig)){
                                a+="NULL";
                            }
                            else{
                                a+="?";
                                v.push(value);
                            }
                        }
                        
                    }
                }
                else{
                    for (var c in b) {
                        if(b[c]["value"]){
                            b[c]["value"] = String(b[c]["value"]);
                        }
                        if(typeof b[c] !== "undefined" && typeof b[c] !== "object" && typeof b[c] === "string" && !b[c].match(/NULL/ig)) v.push(b[c]);
                        else if(typeof b[c] !== "undefined" && typeof b[c] !== "object" && typeof b[c] === "number") v.push(b[c]);
                        else if(typeof b[c]["value"] !== "undefined" && typeof b[c] === "object" && !b[c]["value"].match(/NULL/ig)) v.push(b[c]["value"]);
                        if(typeof b[c] === "object"){
                            if(typeof b[c]["union"] === "undefined"){
                                if(typeof b[c]["value"] === "string" && b[c]["value"].match(/NULL/ig)){
                                    a+="`" + c + "` " + b[c]["value"];
                                }
                                else{
                                    a+="`" + c + "` " + b[c]["operator"] + " ? ";
                                }
                            }
                            else{
                                if(typeof b[c]["value"] === "string" && b[c]["value"].match(/NULL/ig)){
                                    a+="`" + c + "` " + b[c]["value"] + " " + b[c]["union"] + " ";
                                }
                                else{
                                    a+="`" + c + "` " + b[c]["operator"] + " ? " + b[c]["union"] + " ";
                                }
                            }
                        }
                        else{
                            if(typeof b[c] === "string" && b[c].match(/NULL/ig)){
                                a+="`" + c + "` " + b[c];
                            }
                            else{
                                a+="`" + c + "`=?";
                            }
                        }
                        /*
                           a += (typeof b[c] === "object") ? 
                           (typeof b[c]["union"] === "undefined") ? 
                           (typeof b[c]["value"] === "string" && b[c]["value"].match(/NULL/ig)) ? 
                           "`" + c + "` " + b[c]["value"] : 
                           "`" + c + "` " + b[c]["operator"] + " ? " : 
                           (typeof b[c]["value"] === "string" && b[c]["value"].match(/NULL/ig)) ? 
                           "`" + c + "` " + b[c]["value"] + " " + b[c]["union"] + " " : 
                           "`" + c + "` " + b[c]["operator"] + " ? " + b[c]["union"] + " " : 
                           (typeof b[c] === "string" && b[c].match(/NULL/ig)) ? 
                           "`" + c + "` " + b[c] : 
                           "`" + c + "`=?"
                           */
                    }
                }
                return {w:a,p:v};
              },
              replace: function(a, c) {
                for (var b in c) {
                  a = a.replace(new RegExp(b, "ig"), c[b])
                }
                return a;
              },
              createTable: function(j, g) {
                var b = "CREATE TABLE IF NOT EXISTS `{tableName}` ({fields}); ";
                var c = [];
                var a = "";
                for (var e in g) {
                  var l = "{type} {null}";
                  a += "`" + e + "` ";
                  if(typeof g[e]["null"]==="undefined") g[e]["null"]="NULL";
                  for (var k in g[e]) {
                    l = l.replace(new RegExp("{" + k + "}", "ig"), g[e][k])
                  }
                  a += l;
                  if (typeof g[e]["default"] !== "undefined") {
                    a += " DEFAULT " + g[e]["default"]
                  }
                  if (typeof g[e]["primary"] !== "undefined") {
                    a += " PRIMARY KEY"
                  }
                  if (typeof g[e]["auto_increment"] !== "undefined") {
                    a += " AUTOINCREMENT"
                  }
                  if (Object.keys(g)[Object.keys(g).length - 1] != e) {
                    a += ","
                  }
                  if (typeof g[e]["primary"] !== "undefined" && g[e]["primary"]) {
                    c.push(e)
                  }
                }
                var d = {
                  tableName: j,
                  fields: a
                };
                for (var f in d) {
                  b = b.replace(new RegExp("{" + f + "}", "ig"), d[f])
                }
                return this.executeQuery(b, []);
              },
              dropTable: function(a) {
                return this.executeQuery("DROP TABLE IF EXISTS `" + a + "`; ", []);
              },
            };
          } catch (err) {
            console.error(err);
          }
        }
      }
    }
]);
