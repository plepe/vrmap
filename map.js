/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var tileZoom = 18;
var presetsFile = "presets.json";
var centerPos;
var map, tiles, items;
var baseTileID, baseTileSize, centerOffset;
var tilesFromCenter = 3;

// Mapnik is the default world-wide OpenStreetMap style.
var tileServer = "https://tilecache.kairo.at/mapnik/";
// Basemap offers hires tiles for Austria.
//var tileServer = "https://tilecache.kairo.at/basemaphires/";
// Standard Overpass API Server
var overpassURL = "https://overpass-api.de/api/interpreter";
var overpassFrontend;
