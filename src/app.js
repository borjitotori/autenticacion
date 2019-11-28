import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import * as uuid from "uuid";

import "babel-polyfill";

const usr = "bvillarreal";
const pwd = "123";
const url = "cluster0-qr8a1.mongodb.net/test?retryWrites=true&w=majority";

/**
 * Connects to MongoDB Server and returns connected client
 * @param {string} usr MongoDB Server user
 * @param {string} pwd MongoDB Server pwd
 * @param {string} url MongoDB Server url
 */
const connectToDb = async function(usr, pwd, url) {
  const uri = `mongodb+srv://${usr}:${pwd}@${url}`;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await client.connect();
  return client;
};

/**
 * Starts GraphQL server, with MongoDB Client in context Object
 * @param {client: MongoClinet} context The context for GraphQL Server -> MongoDB Client
 */
const runGraphQLServer = function(context) {
  const typeDefs = `
    type Query{
      getFacturas(nombre: String!, token: ID!): [Factura!]

    }
    type Mutation{
      addTitular(nombre: String!, password: String!): Titular!
      addFactura(nombre: String!, token: ID!, concepto: String!, cantidad: Float!): Factura!
      delFactura(nombre: String!, token: ID!, _id: ID!): Factura!
      delTitular(nombre: String!, token: ID!): Titular!
      login(nombre: String!, password: String!): ID!
      logout(nombre: String!, token: ID!): Titular!
    }
    type Factura {
      _id: ID!
      fecha: String!
      concepto: String!
      cantidad: Float!
      titular: Titular
    }
    type Titular {
      _id: ID!
      nombre: String!
      password: String!
      facturas: [Factura!]
      token: ID
    }
    `;

  const resolvers = {
    Titular: {
      facturas: async(parent, args, ctx, info) =>{
        const facturas = parent.facturas;
        const {db} = ctx;
        const collection = db.collection("facturas");
        const result = await collection.find({_id:{$in: facturas}}).toArray();
        return result;
      }
    },
    Factura: {
      titular: async(parent,args,ctx,info) => {
        const author = parent._id;
        const {db} = ctx;
        const collection = db.collection("titulares");
        const result = await collection.findOne({_id: author});
        return result;
      } 
    },
    Query: {
      getFacturas: async (parent, args, ctx, info) => {
        const {nombre, token} = args;
        const { db } = ctx;

        const titularCollection = db.collection("titulares");
        const found = await titularCollection.findOne({nombre: nombre, token});
        if(!found){
          throw new Error ("Combinacion usuario password no existente")
        }
        const collection = db.collection("facturas")
        const result = await collection.find({titular: found._id}).toArray();
        return result;
      },
    },
    Mutation: {
      addTitular: async (parent, args, ctx, info) => {
        const { nombre, password } = args;
        const { db } = ctx;

        const collection = db.collection("titulares");
        const repeat = await collection.findOne({nombre, password});
        if(repeat){
          throw new Error ("Titular ya existente")
        }
        const result = await collection.insertOne({ nombre, password, token: null});

        return {
          _id: result.ops[0]._id,
          nombre,
          password,
          token: null
        };
      },      
      addFactura: async(parent, args, ctx, info) => {
        const {nombre, token, concepto, cantidad} = args;
        const { db } = ctx;

        const titularCollection = db.collection("titulares");
        const found = await titularCollection.findOne({nombre: nombre, token});
        if(!found){
          throw new Error ("Sesion no iniciada")
        }
        const collection = db.collection("facturas");
        const result = await collection.insertOne({
          fecha: new Date(),
          concepto, 
          cantidad, 
          titular: found._id, 
        });

        return{
          concepto,
          cantidad,
          fecha: new Date(),
          author: found._id,
          _id: result.ops[0]._id
        }
      },      
      delFactura: async(parent, args, ctx, info) =>{
        const {nombre, token, _id} = args;
        const { db } = ctx;

        const titularCollection = db.collection("titulares");
        const found = await titularCollection.findOne({nombre: nombre, token});
        if(!found){
          throw new Error ("Sesion no iniciada");
        }
        const collection =  db.collection("facturas");
        const exists = collection.findOne({_id: ObjectID(_id)});
        if(!exists)
          throw new Error ("Esa receta no existe");
        collection.deleteOne({_id: ObjectID(_id) })
        return exists;
      },
      delTitular: async(parent, args, ctx, info) =>{
        const {nombre, token} = args;
        const { db } = ctx;

        const titularCollection = db.collection("titulares");
        const found = await titularCollection.findOne({nombre, token});
        if(!found){
          throw new Error ("Sesion no iniciada");
        }
        const collection = db.collection("facturas");
        const a = [collection.deleteMany({titular: found._id}) ,
        titularCollection.deleteOne({_id: found._id })];
        await Promise.all(a);
        return found;
      },
      login: async(parent, args, ctx, info) => {
        const {nombre, password} = args;
        const { db } = ctx;
        const token = uuid.v4()
        const collection = db.collection("titulares");
        const found = await collection.findOne({nombre, password});
        if(!found)
          throw new Error ("Combinacion usuario password no existente");
        await collection.updateOne({nombre, password},{$set:{token: token}})
        return token;
      },
      logout: async(parent, args, ctx, info) =>{
        const {token, nombre} = args;
        const {db} = ctx;

        const collection = db.collection("titulares");
        const found = await collection.findOneAndUpdate({nombre, token},{$set:{token: null}},{returnNewDocument: true});
        if(!found.value){
          throw new Error("Sesion no iniciada");
        }else{
          return found.value;
        }
      }
    }
  };

  const server = new GraphQLServer({ typeDefs, resolvers, context });
  const options = {
    port: 4000
  };

  try {
    server.start(options, ({ port }) =>
      console.log(
        `Server started, listening on port ${port} for incoming requests.`
      )
    );
  } catch (e) {
    console.info(e);
    server.close();
  }
};

const runApp = async function() {
  const client = await connectToDb(usr, pwd, url);
  console.log("Connect to Mongo DB");
  try {
    runGraphQLServer({ client ,db: client.db("autenticacion") });
  } catch (e) {
    console.log(e)
    client.close();
  }
};

runApp();