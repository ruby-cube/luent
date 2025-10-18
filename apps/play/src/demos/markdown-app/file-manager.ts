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


interface FileTreeNode {
   id: string,
   name: string,
   parentID: string | null,
   root: FileTree | null
}

export class File implements FileTreeNode {
   // type = 'file' as const
   constructor(
      public id: string,
      public name: string,
      public parentID: string | null,
      public root: FileTree
   ) {
   }
}



class Folder implements FileTreeNode {
   // type = 'folder' as const
   children: FileTreeNode[] = []
   map!: Map<string, FileTreeNode>

   constructor(
      public id: string,
      public name: string,
      public parentID: string | null,
      public root: FileTree | null
   ) {
      this.map = root?.map ?? new Map()
   }

   append(node: FileTreeNode) {
      if (node.parentID) {
         const prevParent = this.map.get(node.parentID);
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

   constructor(
      public nodes: FileTreeNodeData[]
   ) {
      super('root', 'root', null, null)

      this.populate(nodes)
   }

   populate(nodes: FileTreeNodeData[]) {
      const map = this.map

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

   reset() {
      this.map.clear()
   }
}