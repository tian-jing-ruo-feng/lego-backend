#!/bin/bash
# shell 脚本中发生错误, 即命令返回值不等于0，则停止执行并推出shell
set -e

mongo <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD')
use lego
db.createUser({
  user: '$MONGO_DB_USERNAME',
  pwd: '$MONGO_DB_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: 'lego;'
  }]
})
db.createCollection('works')
db.works.insertMany([
  {
    id: 19,
    title: '父亲节',
    desc: '父亲节',
    author: '111***aaaa',
    coverImg: 'http://xxxx.png',
    copiedCount: 737,
    isHot: true,
    isTemplate: true,
    createdAt: '2024-11-26T09:27:19.000Z'
  }
])
EOF
