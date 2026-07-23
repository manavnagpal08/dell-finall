"use client"

import { useState, useEffect } from "react"
import { Hub, TPR, Part, Transaction } from "@/types"

export type WorkspaceNodeType = "hub" | "tpr" | "part" | "transaction" | "route"

export interface WorkspaceNode {
  id: string
  type: WorkspaceNodeType
  label: string
  subtitle?: string
  data: Hub | TPR | Part | Transaction | any
}

export function useWorkspaceState() {
  const [activeNode, setActiveNode] = useState<WorkspaceNode | null>(null)
  const [favorites, setFavorites] = useState<WorkspaceNode[]>([])
  const [recentObjects, setRecentObjects] = useState<WorkspaceNode[]>([])

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("operations_favorites")
      if (storedFavs) setFavorites(JSON.parse(storedFavs))

      const storedRecents = localStorage.getItem("operations_recents")
      if (storedRecents) setRecentObjects(JSON.parse(storedRecents))
    } catch (e) {
      console.error("Error loading workspace state", e)
    }
  }, [])

  // Sync favorites
  useEffect(() => {
    localStorage.setItem("operations_favorites", JSON.stringify(favorites))
  }, [favorites])

  // Sync recents
  useEffect(() => {
    localStorage.setItem("operations_recents", JSON.stringify(recentObjects))
  }, [recentObjects])

  const openNode = (node: WorkspaceNode) => {
    setActiveNode(node)
    
    // Add to recents, move to top if exists, limit to 20
    setRecentObjects(prev => {
      const filtered = prev.filter(n => n.id !== node.id)
      return [node, ...filtered].slice(0, 20)
    })
  }

  const toggleFavorite = (node: WorkspaceNode) => {
    setFavorites(prev => {
      const isFav = prev.some(n => n.id === node.id)
      if (isFav) {
        return prev.filter(n => n.id !== node.id)
      } else {
        return [...prev, node]
      }
    })
  }

  const isFavorite = (id: string) => {
    return favorites.some(n => n.id === id)
  }

  return {
    activeNode,
    favorites,
    recentObjects,
    openNode,
    toggleFavorite,
    isFavorite,
    closeNode: () => setActiveNode(null)
  }
}
