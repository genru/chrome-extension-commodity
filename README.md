# Chrome Extension taobao

![build](https://github.com/chibat/chrome-extension-typescript-starter/workflows/build/badge.svg)

Chrome Extension, TypeScript and Visual Studio Code

## Prerequisites

* [node + npm](https://nodejs.org/) (Current Version)

## Option

* [Visual Studio Code](https://code.visualstudio.com/)

## Includes the following

* TypeScript
* Webpack
* React
* Jest
* Example Code
    * Chrome Storage
    * Options Version 2
    * content script
    * count up badge number
    * background

## Project Structure

* src/typescript: TypeScript source files
* src/assets: static files
* dist: Chrome Extension directory
* dist/js: Generated JavaScript files

## Setup

```
npm install
```

## Import as Visual Studio Code project

...

## Build

```
npm run build
```

## Build in watch mode

### terminal

```
npm run watch
```

### Visual Studio Code

Run watch mode.

type `Ctrl + Shift + B`

## Load extension to chrome

Load `dist` directory

## Test
`npx jest` or `npm run test`


## Output
日期	|抓取时间	|店铺名称	|店铺链接	|标题	|宝贝链接	|规格	|已经售卖	|划线价（优惠前）	|卖家（卷后）
--|--|--|--|--|--|--|--|--|--|
8/13/25|	11:30|	汾酒官方旗舰店|	https://shop120585911.taobao.com/?spm=a21n57.shop_search.0.0.4b85523cgi9tN3	|【30天价保】山西杏花村酒 53度玻汾黄盖汾酒475mL*12瓶 性价比| 	https://detail.tmall.com/item.htm?id=521144815212	|475ml*12瓶|		758|	570.97
