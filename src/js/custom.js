const electron = require('electron');
const path = require('path');
const fs = require('fs');

const ipc = electron.ipcRenderer;
const storageFile = path.join((electron.app || electron.remote.app).getPath('userData'),'QuickTasks.json');

var isPopupOpen = false;
var quickTasks = {};
var rocky = null;

$(document).ready(function() {
    Sortable.create(document.getElementById("taskList"), {
        animation: 150,
        handle: ".grabber",
        onSort: function(evt, originalEvent) {
            listUpdated();
        }
    });

    Sortable.create(document.getElementById("completedTaskList"), {
        animation: 150,
        handle: ".grabber",
        onSort: function(evt, originalEvent) {
            listUpdated();
        }
    });

    $('#add-new-task').on('keypress', function(e) {
        if(e.which==13) {
            $('#taskList').append('<li class="task"><table><tbody><tr><td style="width:7.5%;" class="no-padding"><span class="grabber"><strong>&#9776;</strong></span></td><td style="width:5%;" class="no-padding"><div class="pretty p-default p-curve p-thick p-jelly no-margin"><input type="checkbox" onchange="taskInCompleted(this);"/><div class="no-padding state p-info-o"><label>&nbsp;</label></div></div></td><td style="width:77.5%;" class="no-padding"><input style="width:100%;" type="text" class="custom-input" onchange="listUpdated();" value="' + document.getElementById('add-new-task').value + '"/></td></tr></tbody></table></li>');
            document.getElementById('add-new-task').value = "";
            listUpdated();
        }
    });

    clippy.load('Rocky', function(agent){
        rocky = agent;
        rocky.show();
        rocky.moveTo($(window).width()-150, $(window).height()-125, 0);
    }, undefined, 'assets/agents/');

    setTimeout(function() {
        $('.clippy').off('mousedown');
        $('.clippy').on('click', togglePopup);
    }, 200);

    setInterval(function() {
        rocky.animate();
    }, randomIntFromInterval(10000, 300000));

    loadFromFile();
});

ipc.on('command-open-popup', function(event, data) {
    document.getElementById('outerPopup').style.display = "block";
    isPopupOpen = true;
    document.getElementById('add-new-task').focus();
});

ipc.on('popup-opened', function(event, data) {
    rocky.stop();
    rocky.moveTo($(window).width()-150, $(window).height()-125, 0);
});

ipc.on('popup-closed', function(event, data) {
    rocky.stop();
    rocky.moveTo($(window).width()-150, $(window).height()-125, 0);
});

function togglePopup() {
    rocky.stop();
    if(isPopupOpen == true) {
        document.getElementById('outerPopup').style.display = "none";
        isPopupOpen = false;
        ipc.send('close-popup');
        document.getElementById('add-new-task').focus();
    }
    else {
        document.getElementById('outerPopup').style.display = "block";
        isPopupOpen = true;
        ipc.send('open-popup');
    }
}

function listUpdated() {
    var newTasksJson = {"incompleteTasks":[],"completedTasks":[]};
    var incompleteTaskList = document.getElementById('taskList').childNodes;
    var completedTaskList = document.getElementById('completedTaskList').childNodes;

    for(var taskIterator=0; taskIterator<incompleteTaskList.length; taskIterator++) {
        if(incompleteTaskList[taskIterator].tagName != "LI") {
            continue;
        }
        var curInput = incompleteTaskList[taskIterator].getElementsByClassName("custom-input")[0];
        var details = curInput.value;
        if(details == "") {
            var removableParent = curInput.parentNode.parentNode.parentNode.parentNode.parentNode;
            removableParent.parentNode.removeChild(removableParent);
        } else {
            newTasksJson.incompleteTasks.push({"details":details});
        }
    }

    for(var taskIterator=0; taskIterator<completedTaskList.length; taskIterator++) {
        if(completedTaskList[taskIterator].tagName != "LI") {
            continue;
        }
        var curInput = completedTaskList[taskIterator].getElementsByClassName("custom-input")[0];
        var details = curInput.value;
        if(details == "") {
            var removableParent = curInput.parentNode.parentNode.parentNode.parentNode.parentNode;
            removableParent.parentNode.removeChild(removableParent);
        } else {
            newTasksJson.completedTasks.push({"details":details});
        }
    }

    fs.writeFileSync(storageFile, JSON.stringify(newTasksJson));
}

function taskInCompleted(curElement) {
    if(curElement.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id=='taskList') {
        $(curElement.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).detach().prependTo('#completedTaskList');
    }
    else {
        $(curElement.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).detach().appendTo('#taskList');
    }
    listUpdated();
}

function loadFromFile() {
    var fileData;

    try {
        fileData = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
    } catch(err) {
        fileData = {"incompleteTasks":[],"completedTasks":[]};
    }

    for(var taskIterator=0; taskIterator<fileData.incompleteTasks.length; taskIterator++) {
        $('#taskList').append('<li class="task"><table><tbody><tr><td style="width:7.5%;" class="no-padding"><span class="grabber"><strong>&#9776;</strong></span></td><td style="width:5%;" class="no-padding"><div class="pretty p-default p-curve p-thick p-jelly no-margin"><input type="checkbox" onchange="taskInCompleted(this);"/><div class="no-padding state p-info-o"><label>&nbsp;</label></div></div></td><td style="width:77.5%;" class="no-padding"><input style="width:100%;" type="text" class="custom-input" onchange="listUpdated();" value="' + fileData.incompleteTasks[taskIterator].details + '"/></td></tr></tbody></table></li>');
    }

    for(var taskIterator=0; taskIterator<fileData.completedTasks.length; taskIterator++) {
        $('#completedTaskList').append('<li class="task"><table><tbody><tr><td style="width:7.5%;" class="no-padding"><span class="grabber"><strong>&#9776;</strong></span></td><td style="width:5%;" class="no-padding"><div class="pretty p-default p-curve p-thick p-jelly no-margin"><input type="checkbox" checked onchange="taskInCompleted(this);"/><div class="no-padding state p-info-o"><label>&nbsp;</label></div></div></td><td style="width:77.5%;" class="no-padding"><input style="width:100%;" type="text" class="custom-input" onchange="listUpdated();" value="' + fileData.completedTasks[taskIterator].details + '"/></td></tr></tbody></table></li>');
    }
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
