var book;

function UpdateList()
{
	GetBooks();
	
	var racesList = GetContent(races), classesList = GetContent(classes), backgroundsList = GetContent(backgrounds), namesList = GetNames(names);
	document.getElementById('races').innerHTML = MakeHTMLStringStart(racesList);
	document.getElementById('classes').innerHTML = MakeHTMLStringStart(classesList);
	document.getElementById('backgrounds').innerHTML = MakeHTMLStringStart(backgroundsList);
	document.getElementById('names').innerHTML = MakeHTMLStringNamesStart(namesList);
	document.getElementById('uaraces').innerHTML = GetUAStuff(UARaces);
	document.getElementById('uaclasses').innerHTML = GetUAStuff(UAClasses);
	document.getElementById('uaother').innerHTML = GetUAStuff(UAOther);
}

function GetBooks()
{
	books = [ 'PHB' ];
	for(var bookNum in availableBooks)
	{
		var book = availableBooks[bookNum];
		if(book == 'MR')
			continue;
		if(document.getElementById(book + 'box').checked)
			books.push(book);
	}
	if(books.indexOf('VGtM') >= 0)
		books.push('MR');
}

function MakeHTMLStringStart(arr)
{
	var stringBuffer = [];
	for(var index in arr)
	{
		if(arr[index] == 'discarditem')
			continue;
		var item = arr[index], isName = false;
		for(var index2 in item)
		{
			var item2 = item[index2];
			if(item2.name == '_name')
			{
				stringBuffer.push('<h3>', NewCollapsible(), item2.content, ' <sup>(', GetBookId(item2.book), ')</sup>', '</h3>');
				break;
			}
		}
		stringBuffer.push(MakeHTMLString(item));
	}
	return stringBuffer.join('');
}

function MakeHTMLString(item)
{
	var stringBuffer = [];
	// If an object or an array
	if(typeof item == 'object')
	{
		// If an array
		if(Array.isArray(item))
		{
			// Make a new list to hold the contents
			stringBuffer.push('<ul style="display: none">');
			for(var index in item)
			{
				var element = item[index];
				// For array elements we don't want to show
				if((typeof element == 'string' && element.charAt(0) == '_') || (typeof element == 'object' && element.name == '_name'))
					continue;
				if(element.hasOwnProperty('content') && element.content == 'discarditem')
					continue;
					
				stringBuffer.push('<li>', MakeHTMLString(element), '</li>');
			}
			stringBuffer.push('</ul>');
		}
		else
		{
			// If we don't want to show the name
			if(item.name.charAt(0) == '_')
			{
				if(item.hasOwnProperty('book'))
					stringBuffer.push(MakeHTMLString(item.content), ' <sup>(', GetBookId(item.book), ')</sup>');
				else
					stringBuffer.push(MakeHTMLString(item.content));
			}
			else
			{
				if(typeof item.content == 'object')
					stringBuffer.push(NewCollapsible());
				stringBuffer.push('<b>', item.name, '</b>: ', MakeHTMLString(item.content))
			}
		}
	}
	else
	{
		// For tooltips
		while(item.indexOf('[[') >= 0)
		{
			var startIndex = item.indexOf('[['), lineIndex = item.indexOf('|'), endIndex = item.indexOf(']]');
			
			stringBuffer.push(
				item.substring(0, startIndex),
				'<span class="tooltip">',
				item.substring(startIndex + 2, lineIndex),
				'<span class="tooltiptext"> ',
				tooltips[item.substring(lineIndex + 1, endIndex)],
				'</span></span>');
			item = item.substring(endIndex + 2);
		}
		
		// For sub-properties
		if(item.indexOf('**') >= 0)
		{
			var starIndex = item.indexOf('**');
			stringBuffer.push(item.substring(0, starIndex), '<ul><li>');
			item = item.substring(starIndex + 2);
			starIndex = item.indexOf('**');
			while(starIndex >= 0)
			{
				stringBuffer.push(item.substring(0, starIndex), '</li><li>')
				item = item.substring(starIndex + 2);
				starIndex = item.indexOf('**');
			}
			stringBuffer.push(item, '</li></ul>');
		}
		stringBuffer.push(item);
	}
	return stringBuffer.join('');
}

function MakeHTMLStringNamesStart(item)
{
	return '<ul>' + MakeHTMLStringNames(item) + '</ul>';
}

function MakeHTMLStringNames(item)
{
	if(typeof item == 'object')
	{
		var stringBuffer = [];
		if(Array.isArray(item))
		{
			for(var index in item)
			{
				if(item[index] == 'discarditem')
					continue;
				var element = item[index];
				stringBuffer.push(MakeHTMLStringNames(element));
			}
		}
		else
		{
			if(Array.isArray(item.content))
				stringBuffer.push('<li>', NewCollapsible(), '<b>', item.name, '</b>: <ul style="display: none">', MakeHTMLStringNames(item.content), '</ul></li>');
			else
				stringBuffer.push('<li>', '<b>', item.name, '</b>: ', MakeHTMLStringNames(item.content), '</li>');
		}
		return stringBuffer.join('');
	}
	return item;
}

function GetContent(item, book)
{
	if(typeof item == 'object')
	{
		if(Array.isArray(item))
		{	
			var elements = [];
			for(var index in item)
				elements.push(GetContent(item[index], book));
			return elements;
		}
		else
		{
			if(item.hasOwnProperty('_special'))
				return SpecialCase(item);
			return PushAllProperties(item);
		}
	}
	//if(book == null)
		return item;
	//return { 'name' : '_none', 'content' : item, 'book' : book };
}

function PushAllProperties(item, book)
{
	var properties = [];
	for(var propertyName in item)
	{
		if(propertyName != '_special')
		{
			if(book == null)
				properties.push( { 'name' : propertyName, 'content' : GetContent(item[propertyName]) } );
			else
				properties.push( { 'name' : propertyName, 'content' : GetContent(item[propertyName]), 'book' : book } );
		}
	}
	return properties;
}

function CheckHasBook(book)
{
	for(var index in books)
	{
		if(book.indexOf(books[index]) >= 0)
			return true;
	}
	return false;
}

function GetBookString(string)
{
	if(string.substring(0, 5) != 'book-')
		return null;
	var spaceIndex = string.indexOf(' ');
	if(spaceIndex < 0)
		bookString = string.substring(5);
	else
		bookString = string.substring(5, spaceIndex);
	return bookString;
}

function SpecialCase(item)
{
	var special, bookString = GetBookString(item._special);
	if(bookString == null)
		special = item._special;
	else
	{
		if(!CheckHasBook(bookString))
			return 'discarditem';
		var spaceIndex = item._special.indexOf(' ');
		if(spaceIndex < 0)
			return PushAllProperties(item, bookString);
		special = item._special.substring(spaceIndex + 1);
	}
	if (special.substring(0, 6) == "traits")
	{
		var personality = GetContent(backgrounds[parseInt(special.substring(7)) - 1].Personality);
		return personality.slice(0, 4);
	}
	switch(special)
	{
		case 'booksort' :
			var newArr = [];
			for(var bookNum in books)
			{
				var bookId = books[bookNum];
				if(item.hasOwnProperty(bookId))
				{
					var content = GetContent(item[bookId], bookId);
					//if(typeof content == 'string')
					newArr.push(content.join(', ') + ' <sup>(' + GetBookId(bookId) + ')</sup>');	// Lazy but it works and I'm tired
				}
			}
			return FlattenArray(newArr);
		case 'characteristics' :
			var newArr = [];
			newArr.push( { 'name' : 'Base Height', 'content' : Math.floor(item.baseheight / 12) + '\'' + (item.baseheight % 12) + '"' } );
			newArr.push( { 'name' : 'Height Mod', 'content' : '+' + item.heightmod } );
			newArr.push( { 'name' : 'Base Weight', 'content' : item.baseweight + ' lb.' } );
			newArr.push( { 'name' : 'Weight Mod', 'content' : 'x (' + item.weightmod + ') lb.' } );
			for(var otherItemName in item.other)
			{
				var otherItem = item.other[otherItemName];			
				if(otherItem.hasOwnProperty('_special'))
					newArr.push( { 'name' : otherItemName, 'content' : SpecialCase(otherItem) } );
				else if(typeof otherItem == 'object')
				{
					if(Array.isArray(otherItem))
					{
						var otherArray = [];
						for(var index in otherItem)
						{
							if(otherItem[index] != '_none')
								otherArray.push(otherItem[index]);
						}
						newArr.push( { 'name' : otherItemName, 'content' : otherArray.join(', ') } );
					}
					else
						newArr.push( { 'name' : otherItemName, 'content' : GetContent(otherItem) } );
				}
				else
					newArr.push( { 'name' : otherItemName, 'content' : otherItem } );
			}
			return newArr;
		case 'draconicancestry' :
		case 'subracetraitsort' :
		case 'subracephyssort' :
			return PushAllProperties(item);
		case 'gendersort' :
			return [ { 'name' : 'Male' , 'content' : item.Male.join(', ') }, { 'name' : 'Female', 'content' : item.Female.join(', ') } ]
		case 'halfethnicity' :
			return 'discarditem';
		
		// Race stuff
		case 'dragonbornnickname' :
			return item._array.join(', ');
		case 'halfelfvarianttraits' : 
			if(books.indexOf('SCAG') >= 0)
			{
				var newArr = [];
				for(var propertyName in item._list)
				{
					if(propertyName == '_any')
						newArr.push( { 'name' : '_Note', 'content' : item._list[propertyName]._Note }, { 'name' : 'Keen Senses' , 'content' : item._list[propertyName]['Keen Senses'] } );
					else
						newArr.push( { 'name' : propertyName, 'content' : GetContent(item._list[propertyName]) } );
				}
				return newArr;
			}
			return 'discarditem';
		case 'halfelfvariantphys' : 
			return PushAllProperties(item);
		case 'halforcsubraces' :
			return 'discarditem';
		case 'tieflingappearance' :
			var newArr = [];
			for(var index in item._array)
				newArr.push(item._array[index]);
			return newArr.join(', ');
		case 'tieflingvarianttype' :
			return [ 'Feral, Devil\'s Tongue, Hellfire, Winged', { 'name' : 'Note', 'content' : 'The Devil\'s Tongue, Hellfire, and Winged variants are mutually exclusive' } ];
		case 'tieflingvarianttraits' :
			if(books.indexOf('SCAG') >= 0)
				return PushAllProperties(item._list);
			return 'discarditem';
		case 'monstrousorigin' :
			return monstrousOrigins;
			
		// Do this later
		case 'skip' :
			return '';
		// Do this because this isn't the char gen
		case 'ignoreinchargen' :
			return PushAllProperties(item);
	}
	return { 'name' : 'placeholder', 'content' : 'placeholder' };
}

function GetBookId(id)
{
	if(id == 'MR')
		return 'VGtM';
	return id;
}

function FlattenArray(arr)
{
	var newArr = [];
	for(var itemName in arr)
	{
		var item = arr[itemName];
		if(Array.isArray(item))
		{
			item = FlattenArray(item);
			for(var subItemName in item)
				newArr.push(item[subItemName]);
		}
		else
			newArr.push(item);
	}
	return newArr;
}

function GetNames(list)
{
	var nameArr = [];
	for(var propName in list)
	{
		var prop = list[propName];
		if(Array.isArray(prop))
			nameArr.push( { 'name' : propName, 'content' : prop.join(', ') } );
		else
			nameArr.push( { 'name' : propName, 'content' : GetNames(prop) } );
	}
	return nameArr;
}

function NewCollapsible()
{
	return '<span class="collapsiblebutton" onclick="CollapseExpand(this)">[+]</span> '
}

function CollapseExpand(collapsibleButton)
{
	var collapsibleItem = GetCollapseExpandItem(collapsibleButton);
	
	if(collapsibleItem.hasAttribute("style"))
	{
		collapsibleItem.removeAttributeNode(collapsibleItem.getAttributeNode("style"));
		collapsibleButton.innerHTML = '[-]';
	}
	else
	{
		collapsibleItem.style.display = 'none';
		collapsibleButton.innerHTML = '[+]';
	}
}

function GetCollapseExpandItem(collapsibleButton)
{
	if(collapsibleButton.parentElement.nodeName == 'H3')
	{
		var collapsibleItem = collapsibleButton.parentElement;
		while(collapsibleItem.nodeName != 'UL')
			collapsibleItem = collapsibleItem.nextSibling;
		return collapsibleItem;
	}
	else
	{
		var collapsibleItem = collapsibleButton.nextSibling;
		while(collapsibleItem.nodeName != 'UL')
			collapsibleItem = collapsibleItem.nextSibling;
		return collapsibleItem;
	}
}

function ExpandAll()
{
	var buttons = document.getElementsByClassName('collapsiblebutton');
	for(var buttonId = 0; buttonId < buttons.length; buttonId++)
	{
		var collapsibleButton = buttons[buttonId], collapsibleItem = GetCollapseExpandItem(collapsibleButton);
		if(collapsibleItem.hasAttribute("style"))
		{
			collapsibleItem.removeAttributeNode(collapsibleItem.getAttributeNode("style"));
			collapsibleButton.innerHTML = '[-]';
		}
	}
}

function RetractAll()
{
	var buttons = document.getElementsByClassName('collapsiblebutton');
	for(var buttonId = 0; buttonId < buttons.length; buttonId++)
	{
		var collapsibleButton = buttons[buttonId], collapsibleItem = GetCollapseExpandItem(collapsibleButton);
		if(!collapsibleItem.hasAttribute("style"))
		{
			collapsibleItem.style.display = 'none';
			collapsibleButton.innerHTML = '[+]';
		}
	}
}

function GetUAStuff(arr)
{
	var stringBuffer = []
	for(var index in arr)
	{
		var item = arr[index];
		stringBuffer.push('<li><b>', item.name, ':</b> <a href="', item.link, '">', item.source, '</a>');
	}
	return stringBuffer.join('');
}