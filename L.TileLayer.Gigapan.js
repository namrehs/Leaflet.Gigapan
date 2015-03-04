/*
 * L.TileLayer.Gigapan to display Gigapan tiles with Leaflet.
 *
 * Works with quadkey-based filestructure created by Gigapan Stitch.
 *
 * May also work for images hosted at Gigapan.com if the appropriate base URL is used.
 *
 * This plugin is based on the excellent Leaflet.Zoomify plugin by Bjorn Sandvik:
 *    https://github.com/turban/Leaflet.Zoomify
 */

L.TileLayer.Gigapan = L.TileLayer.extend({
	options: {
		continuousWorld: true,
		tolerance: 0.8
	},

	initialize: function (url, options) {
		options = L.setOptions(this, options);
		this._url = url;

    	var imageSize = L.point(options.width, options.height),
	    	tileSize = options.tileSize;

    	this._imageSize = [imageSize];
    	this._gridSize = [this._getGridSize(imageSize)];

        while (parseInt(imageSize.x) > tileSize || parseInt(imageSize.y) > tileSize) {
        	imageSize = imageSize.divideBy(2).floor();
        	this._imageSize.push(imageSize);
        	this._gridSize.push(this._getGridSize(imageSize));
        }

		this._imageSize.reverse();
		this._gridSize.reverse();

        this.options.maxZoom = this._gridSize.length - 1;
	},

	onAdd: function (map) {
		L.TileLayer.prototype.onAdd.call(this, map);

		var mapSize = map.getSize(),
			zoom = this._getBestFitZoom(mapSize),
			imageSize = this._imageSize[zoom],
			center = map.options.crs.pointToLatLng(L.point(imageSize.x / 2, imageSize.y / 2), zoom);

		map.setView(center, zoom, true);
	},

	_getGridSize: function (imageSize) {
		var tileSize = this.options.tileSize;
		return L.point(Math.ceil(imageSize.x / tileSize), Math.ceil(imageSize.y / tileSize));
	},

	_getBestFitZoom: function (mapSize) {
		var tolerance = this.options.tolerance,
			zoom = this._imageSize.length - 1,
			imageSize, zoom;

		while (zoom) {
			imageSize = this._imageSize[zoom];
			if (imageSize.x * tolerance < mapSize.x && imageSize.y * tolerance < mapSize.y) {
				return zoom;
			}			
			zoom--;
		}

		return zoom;
	},

	_tileShouldBeLoaded: function (tilePoint) {
		var gridSize = this._gridSize[this._map.getZoom()];
		return (tilePoint.x >= 0 && tilePoint.x < gridSize.x && tilePoint.y >= 0 && tilePoint.y < gridSize.y);
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint),
			tile = this._getTile(),
			zoom = this._map.getZoom(),
			imageSize = this._imageSize[zoom],
			gridSize = this._gridSize[zoom],
			tileSize = this.options.tileSize;

		if (tilePoint.x === gridSize.x - 1) {
			tile.style.width = imageSize.x - (tileSize * (gridSize.x - 1)) + 'px';
		} 

		if (tilePoint.y === gridSize.y - 1) {
			tile.style.height = imageSize.y - (tileSize * (gridSize.y - 1)) + 'px';			
		} 

		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	},

	getTileUrl: function (tilePoint) {
		var quadKey = this._toQuad(tilePoint.x, tilePoint.y, this._map.getZoom());
		// For Gigapan, level 0 has 0 digits in filename, level 1 has 1 digit, etc.
		// _toQuad function's result has a leading zero, so must trim
		var baseFileName = quadKey.substring(1,quadKey.length);
		return this._url + this._getEnclosingFolders(baseFileName) + 'r' + baseFileName + '.jpg';
	},


	// folders are named based on filename
	// rABCDEFG.jpg will be found at rAB/CDE/rABCDEFG.jpg
	_getEnclosingFolders: function (baseFileName) {
		var enclosingFolders = '';
		for (var i = 0; i < Math.floor(baseFileName.length / 3); i++) {
			if (i === 0) {
				// first has 2 digits and starts with an 'r'
				enclosingFolders = 'r' + baseFileName.substring(0,2) + '/';
			} else {
				// others have 3 digits
				enclosingFolders += baseFileName.substring(i*3-1,i*3+2) + '/';
			}
		}
		return enclosingFolders;
	},
				
			
	
	//From https://code.google.com/p/toolsdotnet/wiki/iosOfflineMaps
	_toQuad: function (x, y, z) {
		var quadkey = '';
		for ( var i = z; i >= 0; --i) {
			var bitmask = 1 << i;
			var digit = 0;
			if ((x & bitmask) !== 0) {
				digit |= 1;}
			if ((y & bitmask) !== 0) {
				digit |= 2;}
			quadkey += digit;
		}
		return quadkey;
	}



});

L.tileLayer.gigapan = function (url, options) {
	return new L.TileLayer.Gigapan(url, options);
};
