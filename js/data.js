/*
 * THE PAGE CONTENT. This is the only file you edit to change the concepts.
 * Everything below is PLACEHOLDER content. Replace it with the real concepts.
 *
 * Structure:
 *   Concept      -> id, name, group, definition, components[]
 *   Component    -> id, name, definition, subcomponents[]
 *   Subcomponent -> id, name, definition
 *
 * Clicking the name of a concept, component or subcomponent opens the side panel
 * with its details. Components and subcomponents show their parent concept's group.
 *
 * Rules (the page shows a readable error list if one is broken):
 *   - Every concept needs a unique "id" and a "name".
 *   - Every component needs an "id" and a "name"; ids must be unique within its concept.
 *   - "group", "definition", "components" and "subcomponents" are optional.
 *     Anything without a "definition" shows "No definition provided." in the panel.
 *   - Keep the quotes, commas and brackets exactly as in the examples.
 *   - To put a double quote inside text, write \"  (backslash then quote).
 */
window.CONCEPTS = [
  {
    id: "C1",
    name: "Concept 1",
    group: "Group 1",
    definition: "Placeholder definition for Concept 1. Replace this with the real definition.",
    components: [
      {
        id: "C1-A",
        name: "Component A",
        definition: "Placeholder definition for Component A of Concept 1.",
        subcomponents: [
          { id: "C1-A-1", name: "Subcomponent 1", definition: "Placeholder definition for Subcomponent 1." },
          { id: "C1-A-2", name: "Subcomponent 2" }
        ]
      },
      {
        id: "C1-B",
        name: "Component B",
        subcomponents: [
          { id: "C1-B-1", name: "Subcomponent 1" }
        ]
      }
    ]
  },
  {
    id: "C2",
    name: "Concept 2",
    group: "Group 3",
    definition: "Placeholder definition for Concept 2. Replace this with the real definition.",
    components: [
      {
        id: "C2-A",
        name: "Component A",
        definition: "Placeholder definition for Component A of Concept 2.",
        subcomponents: [
          { id: "C2-A-1", name: "Subcomponent 1" }
        ]
      }
    ]
  },
  {
    id: "C3",
    name: "Concept 3",
    group: "Group 4",
    definition: "Placeholder definition for Concept 3. Replace this with the real definition.",
    components: [
      { id: "C3-A", name: "Component A" },
      { id: "C3-B", name: "Component B" }
    ]
  },
  {
    id: "C4",
    name: "Concept 4",
    group: "Group 2",
    definition: "Placeholder definition for Concept 4. Replace this with the real definition.",
    components: [
      {
        id: "C4-A",
        name: "Component A",
        subcomponents: [
          { id: "C4-A-1", name: "Subcomponent 1" },
          { id: "C4-A-2", name: "Subcomponent 2" },
          { id: "C4-A-3", name: "Subcomponent 3" }
        ]
      }
    ]
  },
  {
    id: "C5",
    name: "Concept 5",
    group: "Group 5",
    definition: "Placeholder definition for Concept 5. Replace this with the real definition.",
    components: [
      {
        id: "C5-A",
        name: "Component A",
        subcomponents: [
          { id: "C5-A-1", name: "Subcomponent 1" }
        ]
      }
    ]
  }
];
