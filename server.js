var express = require('express')
,   bodyParser = require('body-parser')
,   multiParty = require('connect-multiparty')
,   mongodb = require('mongodb')
,   ObjectId = require('mongodb').ObjectId
,   fs = require('fs');

//express
app = express();

//middleware's
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiParty());

app.use( function (req, res, next) {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

//porta 3000
var porta = 3000;
app.listen(porta);


var db = new mongodb.Db(
    'instagram'
,   new mongodb.Server(
        'localhost'
    ,   27017
    ,   {}
    )
,   {}
);

console.log('Servidor http online na porta ' + porta);

app.get('/', function (req, res) {
    res.send({msg: 'Olá'});
});

//RESTFULL = URI + verbo http

//post (write)
app.post('/api', function (req, res) {

    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:2000/');
    //res.setHeader('Access-Control-Allow-Origin', '*');

    var date = new Date();
    var time_stamp = date.getTime();
    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;
    var path_origem = req.files.arquivo.path;
    var path_destino = './images/' + url_imagem;
    

    fs.rename(path_origem, path_destino, function (err) {
        if(err){
            res.status(500).json({error: err});
            return;
        }//end if(err)
    });

    var dados = {
        titulo: req.body.titulo
    ,   url_imagem: url_imagem
    };


    db.open( function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.insert(dados, function (err, result) {
                if(err){
                    res.json({'status': 'erro'});
                } else {
                    res.json({'status': 'inclusao realizada com sucesso'});
                }

                mongoclient.close();
            });
        });
    });

});

//get (read)
app.get('/api', function (req, res) {

    db.open( function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find().toArray( function (err, results) {
                if(err){
                    res.json(err);
                } else {
                    res.json(results);
                }
            });

            mongoclient.close();

        });
    });

});


//get by id (read)
app.get('/api/:id', function (req, res) {

    db.open( function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find( { _id: ObjectId(req.params.id)  } ).toArray( function (err, results) {
                if(err){
                    res.json(err);
                } else {
                    res.json(results);
                }
            });

            mongoclient.close();

        });
    });
    
});



app.get('/images/:imagem', function (req, res){
    
    var img = req.params.imagem;

    fs.readFile('./images/' + img, function (err, content) {
        if(err){
            res.status(400).json(err);
            return;
        }//end if(err)
        
        res.writeHead(
            200
        ,   { 'content-type' : 'image/jpg'}
        );
        res.end(content);

    });//end fs.readFile('./images/' + img, function (err, content) 
});


//put by id (update)
app.put('/api/:id', function (req, res) {
 
    db.open( function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {

            collection.update(
                { _id: ObjectId(req.params.id)  }
            ,   { $push : { 
                            comentarios: {
                                id_comentario: new ObjectId()
                            ,   comentario: req.body.comentario
                            }
                          }
                }
            ,   {}
            ,   function (err, result) {
                    if(err){
                        res.json(err);
                    } else {
                        res.json(result);
                    }
                }
            );

            mongoclient.close();

        });
    });
        
});


//delete by id (write)
app.delete('/api/:id', function (req, res) {

    db.open( function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {

            collection.update(
                {}
            ,   { $pull : { 
                            comentarios: { id_comentario: ObjectId(req.params.id) }
                          }
                }
            ,   {multi: true}
            ,   function (err, result) {
                    if(err){
                        res.json(err);
                    } else {
                        res.json(result);
                    }
                }
            );//end collection.update


            /*collection.remove(
                { _id: ObjectId(req.params.id)  }
            ,   function (err, result) {
                    if(err){
                        res.json(err);
                    } else {
                        res.json(result);
                    }
                }
            );*/

            mongoclient.close();

        });
    });
        
});