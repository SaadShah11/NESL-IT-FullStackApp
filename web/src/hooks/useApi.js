import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Global cache to prevent re-fetching same resources
const cache = new Map()

/**
 * Custom hook for API calls with caching, loading, and error management
 * @param {string} resource - The API endpoint to fetch
 * @param {object} options - Additional options for the request
 * @param {boolean} options.skip - Skip the initial fetch
 * @param {number} options.cacheTime - Time to cache the response (default: 5 minutes)
 * @param {object} options.fetchOptions - Additional fetch options
 */
export const useApi = (resource, options = {}) => {
  const { 
    skip = false, 
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    fetchOptions = {},
    dependencies = [] // Additional dependencies to trigger refetch
  } = options

  const { apiCall } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  // Generate cache key including dependencies
  const cacheKey = `${resource}:${JSON.stringify(dependencies)}`

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!resource) return

    // Check cache first (unless forcing refresh)
    if (!forceRefresh && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)
      const isExpired = Date.now() - cachedData.timestamp > cacheTime
      
      if (!isExpired) {
        setData(cachedData.data)
        setError(null)
        return cachedData.data
      } else {
        // Remove expired cache
        cache.delete(cacheKey)
      }
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const response = await apiCall(resource, {
        signal: abortControllerRef.current.signal,
        ...fetchOptions
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      setData(result)
      return result
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was aborted, don't update state
        return
      }
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [resource, cacheKey, cacheTime, apiCall]) // Removed fetchOptions to prevent constant re-creation

  // Initial fetch
  useEffect(() => {
    if (!skip && resource) {
      fetchData()
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, skip, cacheKey]) // Use cacheKey which includes dependencies

  // Refetch function for manual triggering
  const refetch = useCallback(() => {
    return fetchData(true) // Force refresh
  }, [fetchData])

  // Mutate function for optimistic updates
  const mutate = useCallback((newData) => {
    setData(newData)
    // Update cache
    cache.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    })
  }, [cacheKey])

  // Clear cache for this resource
  const clearCache = useCallback(() => {
    cache.delete(cacheKey)
  }, [cacheKey])

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    clearCache
  }
}

// Hook for infinite scroll with pagination
export const useInfiniteApi = (resource, options = {}) => {
  const { 
    limit = 10, 
    skip = false,
    initialOffset = 0,
    dependencies = [],
    ...restOptions 
  } = options

  const [allData, setAllData] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(initialOffset)

  // Build paginated resource URL
  const paginatedResource = resource ? `${resource}?limit=${limit}&offset=${offset}` : null

  const { data, loading, error, refetch } = useApi(paginatedResource, {
    skip: skip || !resource,
    dependencies: [offset, ...dependencies], // Re-fetch when offset or other dependencies change
    ...restOptions
  })

  // Append new data when fetched
  useEffect(() => {
    if (data && Array.isArray(data)) {
      if (offset === initialOffset) {
        // First load or reset
        setAllData(data)
      } else {
        // Append to existing data
        setAllData(prev => [...prev, ...data])
      }
      
      // Check if we have more data
      setHasMore(data.length === limit)
    }
  }, [data, offset, limit, initialOffset])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset(prev => prev + limit)
    }
  }, [loading, hasMore, limit])

  const reset = useCallback(() => {
    setOffset(initialOffset)
    setAllData([])
    setHasMore(true)
    // Clear cache for this resource when resetting
    if (resource) {
      const cacheKey = `${resource}:${JSON.stringify(dependencies)}`
      cache.delete(cacheKey)
    }
  }, [initialOffset, resource]) // Removed dependencies to prevent infinite loop

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch: () => {
      reset()
      return refetch()
    }
  }
}

// Utility to clear all cache
export const clearAllCache = () => {
  cache.clear()
} 