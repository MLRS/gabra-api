module.exports = {

	inflect: function (body, callback) {
	    var lemma = body.lemma // 'ipparkja'
	    if (!lemma) {
		return callback('No lemma provided', null)
	    }

	    var perf = conjPerf(lemma)
	    var imp = conjImp(lemma)
	    var impf = conjImpf(imp['p2 sg'], imp['p2 pl'])
	    var tables = {
		'perf': perf,
		'impf': impf,
		'imp': imp
	    };

	    var forms = []

	    for (var aspect in tables) {
		for (var subject in tables[aspect]) {
		    var sf = tables[aspect][subject]
		    var pol_tbl = polarity(sf)

		    for (var pol in pol_tbl) {
			var obj = {
				'surface_form': sf,
				'aspect': aspect,
				'subject': convertAgr(subject),
				'dir_obj': '',
				'ind_obj': '',
				'polarity': pol,
				'sources': [sourceKey]
			};
			forms.push(obj)
		    }
		}
	    }

//	    for (var aspect in tables) {
//		for (var subject in tables[aspect]) {
//		    var sf = tables[aspect][subject]
//		    var tbl = objectProns(sf)
//		    for (var dir_obj in tbl) {
//			for (var ind_obj in tbl[dir_obj]) {
//			    var sf2 = tbl[dir_obj][ind_obj]
//			    var tbl2 = polarity(sf2)
//			    for (var pol in tbl2) {
//				var sf3 = tbl2[pol]
//				var obj = {
//					'surface_form': sf3,
//					'aspect': aspect,
//					'subject': convertAgr(subject),
//					'dir_obj': convertAgr(dir_obj),
//					'ind_obj': convertAgr(ind_obj),
//					'polarity': pol,
//					'sources': [sourceKey]
//				};
//				forms.push(obj)
//			    }
//			}
//		    }
//		}
//	    }

	    callback(null, forms)
	}
};

const sourceKey = 'Camilleri2015';

//  ---------------------------------------------------------------------------
//  -- Entry processing

//  string to object
    function convertAgr (s) {
    switch (s) {
    case null: return null
    case '': return null
    case undefined: return null
    default: return agrs[s]
    }
}

//object to string
function convertAgrObj (agr) { // eslint-disable-line no-unused-vars
    if (agr === null || agr === undefined) {
	return ''
    }
    var out = agr.person
    out += ' ' + agr.number
    if (agr.gender) out += ' ' + agr.gender
    return out
}

var agrs = {
	'p1 sg': {'person': 'p1', 'number': 'sg'},
	'p2 sg': {'person': 'p2', 'number': 'sg'},
	'p3 sg m': {'person': 'p3', 'number': 'sg', 'gender': 'm'},
	'p3 sg f': {'person': 'p3', 'number': 'sg', 'gender': 'f'},
	'p1 pl': {'person': 'p1', 'number': 'pl'},
	'p2 pl': {'person': 'p2', 'number': 'pl'},
	'p3 pl': {'person': 'p3', 'number': 'pl'}
}

var chars = {
	// 'letter': ['a', 'b', 'ċ', 'd', 'e', 'f', 'ġ', 'g', 'għ', 'h', 'ħ', 'i',
	// 'ie', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
	// 'v',
	// 'w', 'x', 'ż', 'z' ],
	'consonant': ['b', 'ċ', 'd', 'f', 'ġ', 'g', 'għ', 'h', 'ħ', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'ż', 'z'],
	// 'coronal_cons': [ 'ċ', 'd', 'n', 'r', 's', 't', 'x', 'ż', 'z' ], //
	// 'konsonanti xemxin'
	// 'liquid_cons': [ 'l', 'm', 'n', 'r', 'għ' ],
	// 'sonorant_cons': [ 'l', 'm', 'n', 'r' ], // See {SA pg13}. Currently
	// unused, but see DoublingConsN below
	// 'doubling_cons_t': [ 'ċ', 'd', 'ġ', 's', 'x', 'ż', 'z' ], // require
	// doubling when prefixed with 't', eg DDUM, ĠĠORR, SSIB, TTIR, ŻŻID {GM
	// pg68,2b} {OM pg90}
	// 'doubling_cons_n': [ 'l', 'm', 'r' ], // require doubling when prefixed
	// with 'n', eg LLAĦĦAQ, MMUR, RRID {OM pg90}
	// 'strong_cons': [ 'b', 'ċ', 'd', 'f', 'ġ', 'g', 'għ', 'h', 'ħ', 'k', 'l',
	// 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'x', 'ż', 'z' ],
	// 'weak_cons': [ 'j', 'w' ],
	'vowel': ['a', 'e', 'i', 'o', 'u']
// 'vowel_ie': [ 'a', 'e', 'i', 'ie', 'o', 'u' ],
// 'digraph': [ 'ie' ],
// 'semi_vowel': [ 'għ', 'j' ],
}

function isConsonant (c) {
    return chars['consonant'].indexOf(c) !== -1
}

function isVowel (c) {
    return chars['vowel'].indexOf(c) !== -1
}

/*
 * Estimate no. of syllables in word. Roughly, this is the no. of vowels
 * (including 'ie').
 */
function countSyllables(word) {
    var vowels = '(ie|a|e|i|i|u)';
    return (word.match(/vowels/g) || []).length;
}

/*
* Stem a word in preparation for the attachment of DO/IO pronouns.
* The stem depends on the class of word, determined by
*/
function stemWord(lemma) {
var stems = {
'eda$' : 1
}
}



function conjPerf (mamma) {

    if (/ixxa$/.test(mamma)) { // DEPENDS ON SYLLABLE COUNT OF STEM
	var stem = mamma.slice(0, -4);
	var syllables = countSyllables(stem);

	if (syllables >= 3) { // ISSUGGER-IXXA
	    return {
		'p1 sg': stem + 'ejt',  // Jiena ISSUĠĠEREJT
		'p2 sg': stem + 'ejt',  // Inti ISSUĠĠEREJT
		'p3 sg m': mamma, // Huwa ISSUĠĠERIXXA
		'p3 sg f': stem + 'iet',  // Hija ISSUĠĠERIET
		'p1 pl': stem + 'ejna',  // Aħna ISSUĠĠEREJNA
		'p2 pl': stem + 'ejtu',  // Intom
		// ISSUĠĠEREJTU
		'p3 pl': stem + 'ew'  // Huma ISSUĠĠEREW
	    }

	} else { // ABOL-IXXA etc
	    return {
		'p1 sg': stem + 'ixxejt',  // Jiena ABOLIXXEJT
		'p2 sg': stem + 'ixxejt',  // Inti ABOLIXXEJT
		'p3 sg m': mamma, // Huwa ABOLIXXA
		'p3 sg f': stem + 'ixxiet',  // Hija
		// ABOLIXXIET
		'p1 pl': stem + 'ixxejna',  // Aħna ABOLIXXEJNA
		'p2 pl': stem + 'ixxejtu',  // Intom ABOLIXXEJTU
		'p3 pl': stem + 'ixxew'  // Huma ABOLIXXEW
	    }
	}


	// ending in 'ista', and stem is > 2syll
    } else if(/ista$/.test(mamma) && countSyllables(mamma.slice(0, -4)) >= 2) {
	var stem = mamma.slice(0, -1) // irrezist- interced- etc

	return {
	    'p1 sg': stem + 'ejt',  // Jiena IRREZISTEJT
	    'p2 sg': stem + 'ejt',  // Inti IRREZISTEJT
	    'p3 sg m': mamma, // Huwa IRREZISTA
	    'p3 sg f': stem + 'iet',  // Hija IRREZISTIET
	    'p1 pl': stem + 'ejna',  // Aħna IRREZISTEJNA
	    'p2 pl': stem + 'ejtu',  // Intom IRREZISTEJTU
	    'p3 pl': stem + 'ew'  // Huma IRREZISTEW
	}

    } else { // ABBOZZA, IPPARKJA ETC
	var ipparkja = mamma
	return {
	    'p1 sg': ipparkja + 'jt',  // Jiena IPPARKJAJT
	    'p2 sg': ipparkja + 'jt',  // Inti IPPARKJAJT
	    'p3 sg m': ipparkja, // Huwa IPPARKJA
	    'p3 sg f': ipparkja + 't',  // Hija IPPARKJAT
	    'p1 pl': ipparkja + 'jna',  // Aħna IPPARKJAJNA
	    'p2 pl': ipparkja + 'jtu',  // Intom IPPARKJAJTU
	    'p3 pl': ipparkja + 'w'  // Huma IPPARKJAW
	}
    }
}

function conjImpf (imp_sg, imp_pl) {
    var euphonicVowel = ''

	if (isConsonant(imp_sg[0])) {
	    euphonicVowel = 'i' // STABILIXXA > NISTABILIXXA
	}

    return {
	'p1 sg': 'n' + euphonicVowel + imp_sg,  // Jiena NIPPARKJA
	'p2 sg': 't' + euphonicVowel + imp_sg,  // Inti TIPPARKJA
	'p3 sg m': 'j' + euphonicVowel + imp_sg,  // Huwa JIPPARKJA
	'p3 sg f': 't' + euphonicVowel + imp_sg,  // Hija TIPPARKJA
	'p1 pl': 'n' + euphonicVowel + imp_pl,  // Aħna NIPPARKJAW
	'p2 pl': 't' + euphonicVowel + imp_pl,  // Intom TIPPARKJAW
	'p3 pl': 'j' + euphonicVowel + imp_pl    // Huma JIPPARKJAW
    }
}

function conjImp (mamma) {
    if (/ixxa$/.test(mamma)) {
	var issuggerixx = mamma.slice(0, -1)
	return {
	    'p2 sg': issuggerixx + 'i', // STABILIXXA > STABILIXXI
	    'p2 pl': issuggerixx + 'u'  // STABILIXXA > STABILIXXU
	}

    } else if(/ista$/.test(mamma)) { // ending in 'ta' -- requires an
	// ending in
	// 'e'
	var irrezist = mamma.slice(0, -1) // chop off the 'a'
	return {
	    'p2 sg': irrezist + 'i', // IRREZISTA > IRREZISTI
	    'p2 pl': irrezist + 'u'  // IRREXISTA > IRREZISTU
	}

    } else {
	var ipparkja = mamma
	return {
	    'p2 sg': ipparkja, // IPPARKJA > IPPARKJA
	    'p2 pl': ipparkja + 'w' // IPPARKJA > IPPARKJAW
	}
    }
}

//Add DOs for a single surface form
function objectProns (sf) {
    var endsVowel = isVowel(sf.slice(-1)) || sf.slice(-2) === 'aw';
    var needsVowelRepl = sf.slice(-4) == 'ista' || sf.slice(-4) == 'ixxa';

    var sfxs = {

	    // No DO
	    '': {
		'': sf,
		'p1 sg': sf + 'li',
		'p2 sg': sf + 'lek',
		'p3 sg m': sf + 'lu',
		'p3 sg f': sf + 'lha',
		'p1 pl': sf + 'lna',
		'p2 pl': sf + 'lkom',
		'p3 pl': sf + 'lhom'
	    },

	    // DO
	    'p1 sg': {

		// IO
		'': sf + 'ni'
	    },

	    // DO
	    'p2 sg': {

		// IO
		'': sf + (endsVowel ? 'k' : 'ek')
	    },

	    // DO
	    'p3 sg m': {

		// IO
		'': sf + (endsVowel ? 'h' : 'u'),
		'p1 sg': sf + 'li',
		'p2 sg': sf + 'lek',
		'p3 sg m': sf + 'lu',
		'p3 sg f': sf + (endsVowel ? 'lha' : 'ilha'),
		'p1 pl': sf + (endsVowel ? 'lna' : 'ilna'),
		'p2 pl': sf +  (endsVowel ? 'lkom' : 'ilkom'),
		'p3 pl': sf +  (endsVowel ? 'lhom' : 'ilhom'),
	    },

	    // DO
	    'p3 sg f': {

		// IO
		'': sf + 'ha',
		'p1 sg': sf + 'hieli',
		'p2 sg': sf + 'hielek',
		'p3 sg m': sf + 'hielu',
		'p3 sg f': sf + 'hielha',
		'p1 pl': sf + 'hielna',
		'p2 pl': sf + 'hielkom',
		'p3 pl': sf + 'hielhom'
	    },

	    // DO
	    'p1 pl': {

		// IO
		'': sf + 'na'
	    },

	    // DO
	    'p2 pl': {

		// IO
		'': sf + 'kom'
	    },

	    // DO
	    'p3 pl': {

		// IO
		'': sf + 'hom',
		'p1 sg': sf + 'homli',
		'p2 sg': sf + 'homlok',
		'p3 sg m': sf + 'homlu',
		'p3 sg f': sf + 'homlha',
		'p1 pl': sf + 'homlna',
		'p2 pl': sf + 'homlkom',
		'p3 pl': sf + 'homlhom'
	    }

    }

    return sfxs
}

function polarity (sf) {
    return {
	'pos': sf,
	'neg': (sf.slice(-1) == 'a') ? sf.slice(0, -1) + 'iex' : sf + 'x'
    }
}
