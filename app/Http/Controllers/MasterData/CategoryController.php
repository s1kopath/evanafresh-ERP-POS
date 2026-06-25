<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::query()
            ->withCount('products')
            ->when($request->string('search')->toString(), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('MasterData/Categories', [
            'categories' => $categories,
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function store(CategoryRequest $request)
    {
        Category::create([
            'name' => $request->string('name'),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Category created.');
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $category->update([
            'name' => $request->string('name'),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Category updated.');
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return back()->with('error', 'Cannot delete a category that still has products.');
        }

        $category->delete();

        return back()->with('success', 'Category deleted.');
    }
}
