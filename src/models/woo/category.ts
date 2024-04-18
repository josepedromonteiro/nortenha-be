export interface Category {
    id: number
    name: string
    slug: string
    parent: number
    description: string
    display: string
    image: any[]
    menu_order: number
    count: number
    _links: Links
}

export interface Links {
    self: Self[]
    collection: Collection[]
    up: Up[]
}

export interface Self {
    href: string
}

export interface Collection {
    href: string
}

export interface Up {
    href: string
}
