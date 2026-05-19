type ID = string;

type User = {
    ID: ID;
    activeDoc: ID;
    activeWorkspace: ID;
    workspaces: ID[];
    assignedDocs: ID[];
    // account info and settings
}

type Workspace = {
    ID: ID;
    name: string;
    icon: string;
    sidebarOpened: boolean;
    activeSideBarView: ID; // TagsIndex | TimeStack | Calendar
    docs: ID[]; // in order of creation
    sharedDocs: ID[];
}

type TimeStack = {  // displays docs in selected tag (if any) in order of most recent
    ID: ID;
    activeTag: ID | null;
    sortBy: "creation" | "modification";
    newestFirst: boolean;
}

type TagIndex = {
    ID: ID;
    pinnedRoots: ID[], // TagID of roots
    roots: ID[],
    cloud: ID[],
    archived: {
        roots: ID[],
        cloud: ID[]
    }
}

type Tag = {
    name: string,
    subtags: Tag[]
}

type Calendar = {
    sundayStart: boolean
}

type Doc = {
    ID: ID;
    title: string;
    tags: ID[];
    dueDateTags: string[]; // date string or number
    doDateTags: string[];
    reviewDateTags: string[];
    assignmentTags: ID[]; //keep a synced list in each user so 
    contents: ID[]; // slabs;
}

type DocSlab = {
    heading: string;
    contents: ID[]; // boardColumns;
    backgroundColor: string;
}

type BoardPanel = {
    contents: ID[] // PanelItems
    backgroundColor: string;
}

type PanelItem = {
    bullet: string;
    indent: number;
    contents: ID[] // contentBlock (textBlock or imageBlock or codeBlock or tableBlock or horizontalRule or callout or quote or bookmark or mediaBlock or equation)
    backgroundColor: string;
    textColor: string;
}

type TextBlock = {
    fragments: ID[] // TextFragments or LineBreaks
}

type TextFragment = {
    ID: ID;
    text: string,
    marks: ID[]
}

type LineBreak = {
    ID: ID;
    marks: ID[]
}

type Mark = {
    ID: ID;
    type: string,
    attributes?: {},
}

type ImageBlock = {
    source: string
    caption: ID // textblock
    captionStyle: "overlay" | "below"
}






