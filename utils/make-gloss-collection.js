/*
* Create a new collection in gabra DB:
* Collection reverses lexemes, i.e. keys English gloss to lexeme ID
*/

//create the collection
db.createCollection('glosses')


//get all lexeme IDs
var lids = db.lexemes.distinct('_id')

for ( j = 0; j < lids.length; j++ ) {
	var lex_id = lids[j]
	var lex = db.lexemes.findOne({'_id': lex_id})
	var gloss = lex.gloss

	if (gloss != null) {

		//split the glosses by newline
		var glosses = gloss.split(/\r?\n/)
		

		for(i = 0; i < glosses.length; i++ ) {
			g = glosses[i].toLowerCase();

			//check if gloss is in the collection already
			entry = db.glosses.findOne({'gloss': g})

			if(entry == null ) {
				db.glosses.insert({'gloss' : g, 'length': g.length, 'lexemes': [ lex_id ]})
			
			} else {
				db.glosses.update({'gloss': g}, {$push: { 'lexemes': lex_id } })
			}

		}

	}

}

//finally set up an index on the collection
//db.glosses.createIndex( { gloss: "text" }, { score: {$meta: "textScore"} } )

db.glosses.createIndex(
   {
     gloss: "text",
   },
   {
     name: "GlossIndex"
   }
 )

db.glosses.createIndex(
   {
     length: -1
   },
   {
     name: "LengthIndex"
 	}
 )