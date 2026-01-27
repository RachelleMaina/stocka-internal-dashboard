export default function ProductCard({ label,value }:{label:string, value:string}) { 
    return (
             <div className="flex items-center">
                  <div className="bg-primary rounded-xl h-24 w-full relative overflow-hidden">
                    <div className="flex flex-col p-4  gap-1">
                    <h2 className="text-sm text-neutral-700 mb-1">{ label}</h2>
                  <p className="text-lg font-semibold">
      {value}
                  </p>
               
                </div>
            <div className="absolute right-[-80] top-[-10] h-32 w-3/4 rounded-full p-4  bg-primary/10 flex items-center justify-end">
              <div className="absolute h-full w-44 rounded-full bg-primary/10er"></div>
            </div>
          </div>
        </div>
    )
}