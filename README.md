# Autenticación

## Install

```
npm install
```

## Use


```graphql
mutation{
  addTitular(nombre: "P", password: "1"){
    nombre
    password
  }
}
```

```graphql
mutation{
  login(nombre:"P", password:"1")
}
```

```graphql
mutation{
  addFactura(nombre:"P", token:"f52f0aa8-db3d-447f-a304-78fadb0e9fef", concepto:"GIT GUD", cantidad: 3.00, ){
    concepto
  }
}
```

```graphql
mutation{
  delFactura(nombre:"P", token:"f52f0aa8-db3d-447f-a304-78fadb0e9fef", _id:"5ddff021a4a7a93d6b35b021"){
    concepto
  }
}
```

```graphql
mutation{
  delTitular(nombre:"P", token:"f52f0aa8-db3d-447f-a304-78fadb0e9fef"){
    nombre
  }
}
```
