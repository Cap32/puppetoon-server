#!/usr/bin/env node

const { NODE_ENV } = process.env;

if (NODE_ENV === 'development') {
	require('babel-register')();
	require('../src/cli');
}
else {
	require('../lib/cli');
}
