exports.transform = function (model) {
  if (model._path === "projects/index.md") {
    // Get individual projects from TOC
    var individualProjects = [];
    
    if (model._tocItems && model._tocItems.length > 0) {
      for (var i = 0; i < model._tocItems.length; i++) {
        var tocItem = model._tocItems[i];
        if (tocItem.name === "Individual Projects" && tocItem.items) {
          individualProjects = tocItem.items;
          break;
        }
      }
    }
    
    // Add projects to model
    model.individualProjects = individualProjects;
  }
  
  return model;
};
