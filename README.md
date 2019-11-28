# Autenticación

## Install

```
npm install
```

## Use

Añadir titular en la base de datos
```graphql
mutation{
  addTitular(nombre: "P", password: "1"){
    nombre
    password
  }
}
```
Logearse con un usuarion constraseña
```graphql
mutation{
  login(nombre:"P", password:"1")
}
```
Añadir factura usando el nombre de usuario y el token de sesión
```graphql
mutation{
  addFactura(nombre:"P", token:"f52f0aa8-db3d-447f-a304-78fadb0e9fef", concepto:"GIT GUD", cantidad: 3.00, ){
    concepto
  }
}
```
Borrrar factura usando el nombre de usuario y el token de sesión
```graphql
mutation{
  delFactura(nombre:"P", token:"f52f0aa8-db3d-447f-a304-78fadb0e9fef", _id:"5ddff021a4a7a93d6b35b021"){
    concepto
  }
}
```
Borrar al titular y sus facturas usando el nombre de usuario y el token de sesión
```graphql
mutation{
  delTitular(nombre:"P", token:"f52f0aa8-db3d-447f-a304-78fadb0e9fef"){
    nombre
  }
}
```

Consultar las facturas del usuario conectado
```graphql
query{
  getFacturas(nombre:"P", token:"f52f0aa8-db3d-447f-a304-78fadb0e9fef"){
    concepto
  }
}
```
