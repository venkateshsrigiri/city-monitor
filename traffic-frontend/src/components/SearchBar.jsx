import { useState } from 'react'
import './SearchBar.css'

function SearchBar({ onSearch }) {
    const [keyword, setKeyword] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        onSearch(keyword)
    }

    const handleClear = () => {
        setKeyword('')
        onSearch('')
    }

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
            <input
                type="text"
                className="search-input"
                placeholder="Search incidents by keyword..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="search-btn">Search</button>
            {keyword && (
                <button type="button" className="clear-btn" onClick={handleClear}>
                    Clear
                </button>
            )}
        </form>
    )
}

export default SearchBar