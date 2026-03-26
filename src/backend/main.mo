import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  type ElementType = {
    #beam;
    #slab;
    #column;
    #wall;
    #girder;
  };

  type ElementStatus = {
    #planned;
    #inProgress;
    #complete;
  };

  type PlacedElement = {
    id : Nat;
    elementType : ElementType;
    name : Text;
    xPosition : Float;
    yPosition : Float;
    width : Float;
    height : Float;
    rotationAngle : Float;
    status : ElementStatus;
    color : Text;
  };

  type LayoutProject = {
    name : Text;
    elements : [PlacedElement];
  };

  module LayoutProject {
    public func compare(p1 : LayoutProject, p2 : LayoutProject) : Order.Order {
      p1.name.compare(p2.name);
    };
  };

  let projects = Map.empty<Text, LayoutProject>();

  public shared ({ caller }) func createProject(name : Text) : async () {
    if (projects.containsKey(name)) { Runtime.trap("Project with this name already exists.") };
    let project : LayoutProject = {
      name;
      elements = [];
    };
    projects.add(name, project);
  };

  public shared ({ caller }) func deleteProject(name : Text) : async () {
    if (not projects.containsKey(name)) { Runtime.trap("Project not found.") };
    projects.remove(name);
  };

  public shared ({ caller }) func addElementToProject(projectName : Text, element : PlacedElement) : async () {
    switch (projects.get(projectName)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) {
        let updatedElements = project.elements.concat([element]);
        let updatedProject : LayoutProject = {
          name = project.name;
          elements = updatedElements;
        };
        projects.add(projectName, updatedProject);
      };
    };
  };

  public shared ({ caller }) func updateElementInProject(projectName : Text, elementId : Nat, newElement : PlacedElement) : async () {
    switch (projects.get(projectName)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) {
        let updatedElements = project.elements.map(
          func(elem) {
            if (elem.id == elementId) { newElement } else { elem };
          }
        );
        let updatedProject : LayoutProject = {
          name = project.name;
          elements = updatedElements;
        };
        projects.add(projectName, updatedProject);
      };
    };
  };

  public shared ({ caller }) func removeElementFromProject(projectName : Text, elementId : Nat) : async () {
    switch (projects.get(projectName)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) {
        let filteredElements = project.elements.filter(
          func(e) { e.id != elementId }
        );
        let updatedProject : LayoutProject = {
          name = project.name;
          elements = filteredElements;
        };
        projects.add(projectName, updatedProject);
      };
    };
  };

  public shared ({ caller }) func updateFullElementList(projectName : Text, newElements : [PlacedElement]) : async () {
    switch (projects.get(projectName)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) {
        let updatedProject : LayoutProject = {
          name = project.name;
          elements = newElements;
        };
        projects.add(projectName, updatedProject);
      };
    };
  };

  public query ({ caller }) func getProject(name : Text) : async LayoutProject {
    switch (projects.get(name)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) { project };
    };
  };

  public query ({ caller }) func listProjects() : async [LayoutProject] {
    projects.values().toArray().sort();
  };
};
