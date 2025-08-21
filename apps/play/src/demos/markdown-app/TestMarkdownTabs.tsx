import { component, For, FromTag } from "@rue/lumo";
import { Ion, ion } from "@rue/quarky";

let id = 1;

function genId() {
   return id++;
}

type FileData = {
   id: number,
   markdown: string,
}

class File {
   // opened: boolean = false
   // active: boolean = false

   constructor(
      public id: number = genId(),
      public markdown: string = ''
   ) { }

   get title() {
      return firstLineOf(this.markdown)
   }

   get preview() {
      return secondLineOf(this.markdown)
   }

   // close() {
   //    this.active = false;
   //    this.opened = false;
   // }

   // open() {
   //    this.active = true;
   //    this.opened = true;
   // }
}

const data = [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]

function asFiles(data: FileData[]) {
   return data.map(file => new File(file.id, file.markdown))
}

function resolvedDispatch(args: any) {
   return ion(asFiles(data));
}

const GET_FILES = ""

export function MarkdownApp() {
   const $allFiles = resolvedDispatch(GET_FILES)


   return component(
      <>
         <Sidebar files={$allFiles}></Sidebar>
            <Main files={$opendFiles}></Main>
      </>
   )
}


function Main(
   { $openedFiles } : FromTag<{
   openedFiles: Ion<File[]>
}>()
) {

   return component(
      <>
         <nav>
            {For($openedFiles, (file) => (
               <Tab file={file}></Tab>
            ))}
         </nav>
         <main></main>
      </>
   )
}
function Sidebar() {
   return component(
      <>
      </>
   )
}

function Tab() {
   return component(
      <>
      </>
   )
}