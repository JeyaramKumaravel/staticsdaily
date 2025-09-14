"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface MultipleDescriptionsProps {
  descriptions: string[];
  onChange: (descriptions: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function MultipleDescriptions({ 
  descriptions, 
  onChange, 
  label = "Descriptions",
  placeholder = "Add a description..."
}: MultipleDescriptionsProps) {
  const [newDescription, setNewDescription] = useState("");

  const addDescription = () => {
    if (newDescription.trim()) {
      onChange([...descriptions, newDescription.trim()]);
      setNewDescription("");
    }
  };

  const removeDescription = (index: number) => {
    onChange(descriptions.filter((_, i) => i !== index));
  };

  const updateDescription = (index: number, value: string) => {
    const updated = [...descriptions];
    updated[index] = value;
    onChange(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDescription();
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Existing descriptions */}
      {descriptions.map((desc, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input
            value={desc}
            onChange={(e) => updateDescription(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeDescription(index)}
            className="text-destructive hover:bg-destructive/10 h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add new description */}
      <div className="flex gap-2 items-center">
        <Input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={addDescription}
          className="text-primary hover:bg-primary/10 h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}