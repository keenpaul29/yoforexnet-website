import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { CreateThreadModal } from "./CreateThreadModal";

export default function CreateThreadButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        size="lg" 
        className="w-full" 
        onClick={() => setOpen(true)}
        data-testid="button-create-thread"
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        New Thread
      </Button>
      
      <CreateThreadModal open={open} onOpenChange={setOpen} />
    </>
  );
}
