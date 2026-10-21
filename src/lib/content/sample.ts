export const samplePosts = [
  {
    id: 1,
    userId: 1,
    title: "A fresh start for your content",
    body: "A website redesign should open up possibilities, not leave useful content behind. Start by taking stock of the articles, pages and ideas that deserve a new home.\n\nA consistent content model makes that move easier. Separate the words from their presentation, keep a reference to the source, and give every record a stable identity.",
  },
  {
    id: 2,
    userId: 1,
    title: "Small migrations, clear boundaries",
    body: "Move a small collection first. A bounded import lets you inspect real content, spot unexpected fields and understand the destination before you scale up.\n\nMake the limits visible. Knowing what was imported is just as important as knowing that a request succeeded.",
  },
  {
    id: 3,
    userId: 2,
    title: "Give every field a purpose",
    body: "Different systems have different names for the same idea. A source might call an author userId, while your content model calls it authorId.\n\nDocument the mapping, represent missing metadata explicitly and keep transformations predictable. The next person working with the content should not have to guess.",
  },
  {
    id: 4,
    userId: 2,
    title: "Preview before you publish",
    body: "A successful API request is only the beginning. Read the transformed title and body. Check the source identity and generated slug. Look at the structured record as well as the readable preview.\n\nAn inspection step gives people a chance to catch mistakes before content reaches another system.",
  },
  {
    id: 5,
    userId: 3,
    title: "Design for the unavailable API",
    body: "External services can be slow or unavailable. Timeouts and useful errors keep that failure understandable. A clearly labelled sample collection keeps the workflow available to explore.\n\nSample data should always be an explicit choice. It should never quietly replace the results of a failed live request.",
  },
  {
    id: 6,
    userId: 3,
    title: "Portable content, fewer assumptions",
    body: "Plain text and stable identifiers make a useful starting point for moving content. Keep the original source reference and avoid inventing publication dates or author names that the source never supplied.\n\nMore formats can come later. First, make the content you already have understandable and reliable.",
  },
];
