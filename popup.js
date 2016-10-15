// Copyright (c) 2012 Gerard Lee <gerarldlee@gmail.com>
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function Node(data) {
    this.data = data;
    this.next = null;
}
function SequentialLinkedList() {
    this._length = 0;
    this.head = null;
}
SequentialLinkedList.prototype.add = function(value) {
    var node = new Node(value),
        currentNode = this.head;
    if (!currentNode) {
        this.head = node;
        this._length++;
        return node;
    }
    while (currentNode.next) {
        currentNode = currentNode.next;
    }
    currentNode.next = node;
    this._length++;
    return node;
};
SequentialLinkedList.prototype.get = function(position) {
    var currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'};
    if (length === 0 || position < 1 || position > length) {
        throw new Error(message.failure);
    }
    while (count < position) {
        currentNode = currentNode.next;
        count++;
    }
    return currentNode;
};
SequentialLinkedList.prototype.insertAt = function(position, value) {
    var tmpNode = new Node(value),
        currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'};
    if (length === 0 || position < 1 || position > length) {
        throw new Error(message.failure);
    }
    while (count < position) {
        currentNode = currentNode.next;
        count++;
    }
    tmpNode.next = currentNode.next;
    currentNode.next = tmpNode;
    this._length++;
    return currentNode;
};

var bookmarks = [];
var duplicateBookmarks = [];
var totalBookmarks = 0;
var totalDuplicates = 0;
var arrangedList = new SequentialLinkedList();

function dumpDuplicateBookmarks() {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
        getTreeNode(bookmarkTreeNodes, "");
        console.debug("Total Bookmark Count: " + totalBookmarks);
        console.debug("Total Single Count: " + bookmarks.length);
        console.debug("Total Duplicates Count: " + totalDuplicates);
        arrangeLinkList();
        console.debug("Linked List: " + arrangedList._length);
        populateDuplicateBookmarksFolder();
        console.debug("Total Duplicate Bookmarks Count: " + duplicateBookmarks.length);
        $('#deletedialog').html("<input type=button value='Delete Duplicates' />");
        $('#deletedialog').click(function() {
          var allInputs = document.getElementsByTagName("input");
          for (var i = 0, max = allInputs.length; i < max; i++){
            if (allInputs[i].type === 'checkbox') {
              if (allInputs[i].checked) {
                //console.log(allInputs[i].value);
                chrome.bookmarks.remove(String(allInputs[i].value));
              }
            }

          }
        });
    });
}

function arrangeLinkList() {
  var i=0;
  for (i = 0; i < duplicateBookmarks.length; i++) {
  //for (i = 0; i < 4; i++) {

    var duplicateFound = false;
    var j = 0;
    for (j = 1; j <= arrangedList._length; j++) {
      var node = arrangedList.get(j);
      // console.log(node.data.bookmarkTreeNode.url, duplicateBookmarks[i].bookmarkTreeNode.url);
      if (node.data.bookmarkTreeNode.url === duplicateBookmarks[i].bookmarkTreeNode.url) {
        // console.log(true);
        duplicateFound = true;
        if (node.data.bookmarkTreeNode.id != duplicateBookmarks[i].bookmarkTreeNode.id) {
          duplicateBookmarks[i].selected = true;
          arrangedList.insertAt(j, duplicateBookmarks[i]);
          break;
        }
        else {
          break;
        }
      }
    }

    if (!duplicateFound) {
      arrangedList.add(duplicateBookmarks[i]);
    }
  }
}

function populateDuplicateBookmarksFolder() {
  var i = 0;
  var append = "<ul>";
  for (i = 1; i <= arrangedList._length; i++) {
    var node = arrangedList.get(i);

    if (i > 1 && !node.data.selected) {
      append += "</ul><ul>";
    }

    append += "<li><input type=checkbox value=\""+node.data.bookmarkTreeNode.id+"\" " + (node.data.selected ? "checked" : "") + " />";
    append += "<span>" + node.data.folder + " (" + node.data.bookmarkTreeNode.id + ") " + node.data.bookmarkTreeNode.url+"</span></li>";
  }
  append += "</ul>";
  $('#duplicateBookmarks').append(append);
}

function getTreeNode(bookmarkTreeNodes, parentDirectory) {
  var i;
  for (i = 0; i < bookmarkTreeNodes.length; i++) {
    if (bookmarkTreeNodes[i].children && bookmarkTreeNodes[i].children.length > 0) {
      var tmpParentDirectory = parentDirectory;
      parentDirectory += "/" + bookmarkTreeNodes[i].title;
      getTreeNode(bookmarkTreeNodes[i].children, parentDirectory);
      parentDirectory = tmpParentDirectory;
    }
    else {
      var j = 0;
      var duplicate = false;
      for (j = 0; j < bookmarks.length; j++) {
        if (bookmarks[j].bookmarkTreeNode.url === bookmarkTreeNodes[i].url) {
          var bookmarkFromBookmarksWithDuplicates = {
            folder: bookmarks[j].folder,
            selected: false,
            bookmarkTreeNode: bookmarks[j].bookmarkTreeNode
          }
          duplicateBookmarks.push(bookmarkFromBookmarksWithDuplicates);
          var duplicateBookmark = {
            folder: parentDirectory,
            selected: false,
            bookmarkTreeNode: bookmarkTreeNodes[i]
          }
          duplicateBookmarks.push(duplicateBookmark);
          totalDuplicates++;
          duplicate = true;
        }
      }
      if (!duplicate) {
        var bookmark = {
          folder: parentDirectory,
          selected: false,
          bookmarkTreeNode: bookmarkTreeNodes[i]
        }
        bookmarks.push(bookmark);
      }
      totalBookmarks++;
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  dumpDuplicateBookmarks();
});