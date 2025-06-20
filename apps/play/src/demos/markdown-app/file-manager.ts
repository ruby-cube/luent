type FileData = {
   id: string;
   type: 'file';
   parentID: string | null;
   name: string;
}

type FolderData = {
   id: string,
   type: 'folder';
   parentID: string | null,
   name: string
}

interface FileTreeNodeData {
   id: string,
   type: 'folder' | 'file';
   parentID: string | null,
   name: string
}


export class FileTreeNode {
   constructor(
      public id: string,
      public name: string,
      public parentID: string | null,
      protected root: FileTree | null
   ) {
   }
}

export class File extends FileTreeNode {
   // type = 'file' as const
   constructor(
      id: string,
      name: string,
      parentID: string | null,
      root: FileTree
   ) {
      super(id, name, parentID, root)
   }
}



class Folder extends FileTreeNode {
   // type = 'folder' as const
   children: (File | Folder)[] = []
   constructor(
      id: string,
      name: string,
      parentID: string | null,
      root: FileTree | null
   ) {
      super(id, name, parentID, root)

   }

   append(node: FileTreeNode) {
      if (node.parentID) {
         const map = this instanceof FileTree ? this.map : this.root!.map
         const prevParent = map.get(node.parentID);
         if (prevParent && prevParent instanceof Folder) {
            prevParent.remove(node)
         }
      }
      this.children.push(node)
      node.parentID = this.id
   }

   remove(node: FileTreeNode) {
      this.children = this.children.filter(item => item.id !== node.id)
   }

}

class FileTree extends Folder {
   map: Map<string, FileTreeNode>

   constructor(
      nodes: FileTreeNodeData[]
   ) {
      super('root', 'root', null, null)

      const map = this.map = new Map()

      for (const node of nodes) {
         const { id, name, parentID } = node
         map.set(node.id, node.type === 'file' ? new File(id, name, parentID, this) : new Folder(id, name, parentID, this))
      }

      for (const node of nodes) {
         const treeNode = map.get(node.id)!
         const parent = node.parentID ? map.get(node.parentID) : null;
         if (parent && parent instanceof Folder) {
            parent.children.push(treeNode)
         }
         else {
            this.children.push(treeNode)
         }
      }

   }

}